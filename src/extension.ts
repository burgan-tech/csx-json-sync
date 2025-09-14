import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface CSXMapping {
    location: string;
    code: string;
}

interface SyncResult {
    success: boolean;
    message: string;
    filesUpdated: string[];
}

interface VNextConfig {
    domain: string;
    paths: {
        componentsRoot: string;
        tasks: string;
        views: string;
        functions: string;
        extensions: string;
        workflows: string;
        schemas: string;
    };
}

interface ProjectStructure {
    componentsRoot: string;
    allPaths: string[];
}

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('CSX-JSON Sync');
    let fileWatcher: vscode.FileSystemWatcher | undefined;
    let debounceTimer: NodeJS.Timeout | undefined;

    // Extension aktif olduğunda mesaj göster
    outputChannel.appendLine('CSX-JSON Sync extension activated');
    
    // Auto-sync başlat
    startAutoSync();

    // Commands register et
    const commands = [
        vscode.commands.registerCommand('csxJsonSync.syncAll', () => syncAllCSXFiles()),
        vscode.commands.registerCommand('csxJsonSync.syncCurrent', () => syncCurrentCSXFile()),
        vscode.commands.registerCommand('csxJsonSync.enableAutoSync', () => enableAutoSync()),
        vscode.commands.registerCommand('csxJsonSync.disableAutoSync', () => disableAutoSync())
    ];

    context.subscriptions.push(...commands);
    context.subscriptions.push(outputChannel);

    function getConfig() {
        const config = vscode.workspace.getConfiguration('csxJsonSync');
        return {
            enabled: config.get<boolean>('enabled', true),
            debounceMs: config.get<number>('debounceMs', 500)
        };
    }

    function getWorkspaceRoot(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 
            ? workspaceFolders[0].uri.fsPath 
            : undefined;
    }

    function readVNextConfig(): VNextConfig | null {
        try {
            const workspaceRoot = getWorkspaceRoot();
            if (!workspaceRoot) {
                outputChannel.appendLine('No workspace folder found');
                return null;
            }

            const configPath = path.join(workspaceRoot, 'vnext.config.json');
            if (!fs.existsSync(configPath)) {
                outputChannel.appendLine('vnext.config.json not found. This extension requires vnext.config.json to work properly.');
                return null;
            }

            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent) as VNextConfig;
            
            outputChannel.appendLine(`VNext config loaded: domain=${config.domain}, componentsRoot=${config.paths.componentsRoot}`);
            return config;
        } catch (error) {
            outputChannel.appendLine(`Error reading vnext.config.json: ${error}`);
            return null;
        }
    }

    function getProjectStructure(): ProjectStructure | null {
        const config = readVNextConfig();
        if (!config) {
            return null;
        }

        const workspaceRoot = getWorkspaceRoot();
        if (!workspaceRoot) {
            return null;
        }

        const componentsRoot = path.join(workspaceRoot, config.paths.componentsRoot);
        
        // Tüm path'leri topla
        const allPaths: string[] = [
            path.join(componentsRoot, config.paths.tasks),
            path.join(componentsRoot, config.paths.views),
            path.join(componentsRoot, config.paths.functions),
            path.join(componentsRoot, config.paths.extensions),
            path.join(componentsRoot, config.paths.workflows),
            path.join(componentsRoot, config.paths.schemas)
        ];

        // Var olan path'leri filtrele
        const existingPaths = allPaths.filter(p => fs.existsSync(p));
        
        outputChannel.appendLine(`Found ${existingPaths.length} existing component directories:`);
        existingPaths.forEach(p => outputChannel.appendLine(`  - ${path.relative(workspaceRoot, p)}`));

        return {
            componentsRoot,
            allPaths: existingPaths
        };
    }

    function findAllCSXFiles(): string[] {
        const structure = getProjectStructure();
        if (!structure) {
            return [];
        }

        const allCSXFiles: string[] = [];

        for (const componentPath of structure.allPaths) {
            try {
                // Her klasörde /src altındaki .csx dosyalarını ara
                const srcPath = path.join(componentPath, 'src');
                if (fs.existsSync(srcPath)) {
                    const csxFiles = findCSXFilesRecursive(srcPath);
                    allCSXFiles.push(...csxFiles);
                }
            } catch (error) {
                outputChannel.appendLine(`Error scanning ${componentPath}: ${error}`);
            }
        }

        return allCSXFiles;
    }

    function findCSXFilesRecursive(dir: string): string[] {
        const csxFiles: string[] = [];
        
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    // Alt klasörleri de tara
                    csxFiles.push(...findCSXFilesRecursive(fullPath));
                } else if (item.isFile() && item.name.endsWith('.csx')) {
                    csxFiles.push(fullPath);
                }
            }
        } catch (error) {
            outputChannel.appendLine(`Error reading directory ${dir}: ${error}`);
        }
        
        return csxFiles;
    }

    function findJSONFilesForCSX(csxFilePath: string): string[] {
        const structure = getProjectStructure();
        if (!structure) {
            return [];
        }

        const workspaceRoot = getWorkspaceRoot();
        if (!workspaceRoot) {
            return [];
        }

        // CSX dosyasının hangi component klasöründe olduğunu bul
        let componentDir: string | null = null;
        
        for (const componentPath of structure.allPaths) {
            const srcPath = path.join(componentPath, 'src');
            if (csxFilePath.startsWith(srcPath)) {
                componentDir = componentPath;
                break;
            }
        }

        if (!componentDir) {
            outputChannel.appendLine(`Could not determine component directory for ${csxFilePath}`);
            return [];
        }

        // Aynı component klasöründeki JSON dosyalarını bul
        const jsonFiles: string[] = [];
        
        try {
            const items = fs.readdirSync(componentDir, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isFile() && item.name.endsWith('.json')) {
                    jsonFiles.push(path.join(componentDir, item.name));
                }
            }
        } catch (error) {
            outputChannel.appendLine(`Error reading component directory ${componentDir}: ${error}`);
        }

        return jsonFiles;
    }

    function convertToBase64(filePath: string): string | null {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return Buffer.from(content, 'utf8').toString('base64');
        } catch (error) {
            outputChannel.appendLine(`Error reading CSX file ${filePath}: ${error}`);
            return null;
        }
    }

    function findCSXUsageInJSON(csxFilePath: string, jsonFilePath: string): boolean {
        try {
            const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
            
            // CSX dosyasının JSON dosyasına göre relative path'ini hesapla
            const relativePath = getRelativeCSXPath(csxFilePath, jsonFilePath);
            if (!relativePath) {
                return false;
            }
            
            const locationPattern = `"${relativePath}"`;
            return jsonContent.includes(locationPattern);
        } catch (error) {
            outputChannel.appendLine(`Error reading JSON file ${jsonFilePath}: ${error}`);
            return false;
        }
    }

    function getRelativeCSXPath(csxFilePath: string, jsonFilePath: string): string | null {
        try {
            const jsonDir = path.dirname(jsonFilePath);
            const relativePath = path.relative(jsonDir, csxFilePath);
            
            // Unix style path'e çevir (Windows uyumluluğu için)
            const unixPath = relativePath.replace(/\\/g, '/');
            
            // Eğer aynı dizinde değilse ./ ile başlat
            if (!unixPath.startsWith('../')) {
                return `./${unixPath}`;
            }
            
            return unixPath;
        } catch (error) {
            outputChannel.appendLine(`Error calculating relative path from ${jsonFilePath} to ${csxFilePath}: ${error}`);
            return null;
        }
    }

    function updateJSONFile(jsonFilePath: string, csxFilePath: string, base64Code: string): boolean {
        try {
            const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
            const jsonData = JSON.parse(jsonContent);

            let updated = false;
            const locationToFind = getRelativeCSXPath(csxFilePath, jsonFilePath);
            
            if (!locationToFind) {
                return false;
            }

            // JSON'da location'ı recursive olarak ara ve güncelle
            function updateRecursive(obj: any): void {
                if (typeof obj === 'object' && obj !== null) {
                    if (Array.isArray(obj)) {
                        obj.forEach(item => updateRecursive(item));
                    } else {
                        for (const key in obj) {
                            if (key === 'location' && obj[key] === locationToFind) {
                                // Aynı seviyede 'code' alanını güncelle
                                if ('code' in obj) {
                                    obj.code = base64Code;
                                    updated = true;
                                    outputChannel.appendLine(`Updated code for ${locationToFind} in ${path.basename(jsonFilePath)}`);
                                }
                            } else {
                                updateRecursive(obj[key]);
                            }
                        }
                    }
                }
            }

            updateRecursive(jsonData);

            if (updated) {
                // JSON'ı güzel formatla yaz
                const updatedContent = JSON.stringify(jsonData, null, 2);
                fs.writeFileSync(jsonFilePath, updatedContent, 'utf8');
                return true;
            }

            return false;
        } catch (error) {
            outputChannel.appendLine(`Error updating JSON file ${jsonFilePath}: ${error}`);
            return false;
        }
    }

    function syncCSXFile(csxFilePath: string): SyncResult {
        const result: SyncResult = {
            success: false,
            message: '',
            filesUpdated: []
        };

        try {
            const workspaceRoot = getWorkspaceRoot();
            if (!workspaceRoot) {
                result.message = 'No workspace folder found';
                return result;
            }

            // vnext.config.json kontrolü
            const structure = getProjectStructure();
            if (!structure) {
                result.message = 'vnext.config.json not found or invalid. This extension requires vnext.config.json to work properly.';
                return result;
            }

            const csxFileName = path.basename(csxFilePath);
            
            // Base64'e çevir
            const base64Code = convertToBase64(csxFilePath);
            if (!base64Code) {
                result.message = `Failed to convert ${csxFileName} to base64`;
                return result;
            }

            // Bu CSX dosyası için ilgili JSON dosyalarını bul
            const jsonFiles = findJSONFilesForCSX(csxFilePath);
            
            if (jsonFiles.length === 0) {
                result.message = `No JSON files found in the same component directory as ${csxFileName}`;
                return result;
            }

            let updatedCount = 0;

            for (const jsonFile of jsonFiles) {
                if (findCSXUsageInJSON(csxFilePath, jsonFile)) {
                    if (updateJSONFile(jsonFile, csxFilePath, base64Code)) {
                        result.filesUpdated.push(path.relative(workspaceRoot, jsonFile));
                        updatedCount++;
                    }
                }
            }

            if (updatedCount > 0) {
                result.success = true;
                result.message = `Successfully updated ${updatedCount} JSON file(s) for ${csxFileName}`;
            } else {
                result.message = `No JSON files found that reference ${csxFileName}`;
            }

            return result;

        } catch (error) {
            result.message = `Error syncing CSX file: ${error}`;
            return result;
        }
    }

    function syncCurrentCSXFile() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        const filePath = activeEditor.document.fileName;
        if (!filePath.endsWith('.csx')) {
            vscode.window.showWarningMessage('Current file is not a CSX file');
            return;
        }

        const result = syncCSXFile(filePath);
        
        if (result.success) {
            vscode.window.showInformationMessage(result.message);
            outputChannel.appendLine(`SUCCESS: ${result.message}`);
            outputChannel.appendLine(`Updated files: ${result.filesUpdated.join(', ')}`);
        } else {
            vscode.window.showErrorMessage(result.message);
            outputChannel.appendLine(`ERROR: ${result.message}`);
        }
    }

    function syncAllCSXFiles() {
        const workspaceRoot = getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        // vnext.config.json kontrolü
        const structure = getProjectStructure();
        if (!structure) {
            vscode.window.showErrorMessage('vnext.config.json not found or invalid. This extension requires vnext.config.json to work properly.');
            return;
        }

        // Tüm CSX dosyalarını bul
        const csxFiles = findAllCSXFiles();

        if (csxFiles.length === 0) {
            vscode.window.showInformationMessage('No CSX files found in project structure');
            return;
        }

        let totalUpdated = 0;
        const allUpdatedFiles: string[] = [];

        outputChannel.appendLine(`Starting sync of ${csxFiles.length} CSX files from project structure...`);

        for (const csxFile of csxFiles) {
            const result = syncCSXFile(csxFile);
            if (result.success) {
                totalUpdated++;
                allUpdatedFiles.push(...result.filesUpdated);
                outputChannel.appendLine(`✓ ${path.relative(workspaceRoot, csxFile)}: ${result.message}`);
            } else {
                outputChannel.appendLine(`✗ ${path.relative(workspaceRoot, csxFile)}: ${result.message}`);
            }
        }

        const message = `Sync completed: ${totalUpdated}/${csxFiles.length} CSX files processed successfully`;
        vscode.window.showInformationMessage(message);
        outputChannel.appendLine(`\n${message}`);
        outputChannel.appendLine(`Total JSON files updated: ${new Set(allUpdatedFiles).size}`);
    }

    function startAutoSync() {
        const config = getConfig();
        
        if (!config.enabled) {
            outputChannel.appendLine('Auto-sync is disabled');
            return;
        }

        const workspaceRoot = getWorkspaceRoot();
        if (!workspaceRoot) {
            return;
        }

        // vnext.config.json kontrolü
        const structure = getProjectStructure();
        if (!structure) {
            outputChannel.appendLine('Auto-sync disabled: vnext.config.json not found or invalid');
            return;
        }

        // Tüm component klasörlerindeki /src altlarını izle
        const watchPatterns: string[] = [];
        
        for (const componentPath of structure.allPaths) {
            const srcPath = path.join(componentPath, 'src');
            if (fs.existsSync(srcPath)) {
                const pattern = path.join(srcPath, '**/*.csx').replace(/\\/g, '/');
                watchPatterns.push(pattern);
            }
        }

        if (watchPatterns.length === 0) {
            outputChannel.appendLine('Auto-sync disabled: No /src directories found in project structure');
            return;
        }

        // Tüm pattern'ler için tek bir watcher kullan
        // VS Code'da multiple pattern'ler için RelativePattern kullanabiliriz
        const combinedPattern = `{${watchPatterns.join(',')}}`;
        
        fileWatcher = vscode.workspace.createFileSystemWatcher(combinedPattern);

        fileWatcher.onDidChange((uri) => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            debounceTimer = setTimeout(() => {
                outputChannel.appendLine(`File changed: ${path.relative(workspaceRoot, uri.fsPath)}`);
                const result = syncCSXFile(uri.fsPath);
                
                if (result.success) {
                    outputChannel.appendLine(`Auto-sync: ${result.message}`);
                    // Sessiz bildirim
                    vscode.window.setStatusBarMessage(
                        `$(sync) Synced ${path.basename(uri.fsPath)}`, 
                        3000
                    );
                } else {
                    outputChannel.appendLine(`Auto-sync failed: ${result.message}`);
                }
            }, config.debounceMs);
        });

        outputChannel.appendLine(`Auto-sync enabled for ${watchPatterns.length} component directories:`);
        watchPatterns.forEach(pattern => outputChannel.appendLine(`  - ${pattern}`));
    }

    function enableAutoSync() {
        if (fileWatcher) {
            fileWatcher.dispose();
        }
        
        const config = vscode.workspace.getConfiguration('csxJsonSync');
        config.update('enabled', true, vscode.ConfigurationTarget.Workspace);
        
        startAutoSync();
        vscode.window.showInformationMessage('Auto-sync enabled');
        outputChannel.appendLine('Auto-sync manually enabled');
    }

    function disableAutoSync() {
        if (fileWatcher) {
            fileWatcher.dispose();
            fileWatcher = undefined;
        }
        
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = undefined;
        }

        const config = vscode.workspace.getConfiguration('csxJsonSync');
        config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
        
        vscode.window.showInformationMessage('Auto-sync disabled');
        outputChannel.appendLine('Auto-sync manually disabled');
    }

    // Configuration değişikliklerini dinle
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('csxJsonSync')) {
            outputChannel.appendLine('Configuration changed, restarting auto-sync...');
            
            if (fileWatcher) {
                fileWatcher.dispose();
                fileWatcher = undefined;
            }
            
            startAutoSync();
        }
    });
}

export function deactivate() {
    // Cleanup kodu
}
