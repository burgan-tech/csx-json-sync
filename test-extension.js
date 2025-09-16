#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test için workspace root
const workspaceRoot = '/Users/U06347/Documents/repos/db';

console.log('🧪 CSX-JSON Sync Extension Test (VNext Structure)');
console.log('==================================================');

// Test 1: vnext.config.json dosyasını kontrol et
console.log('\n📋 Test 1: Checking vnext.config.json...');
const configPath = path.join(workspaceRoot, 'vnext.config.json');

if (fs.existsSync(configPath)) {
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        console.log(`✅ vnext.config.json found: ${configPath}`);
        console.log(`📄 Domain: ${config.domain}`);
        console.log(`📄 Components Root: ${config.paths.componentsRoot}`);
        console.log('📄 Component paths:');
        Object.entries(config.paths).forEach(([key, value]) => {
            if (key !== 'componentsRoot') {
                console.log(`   - ${key}: ${value}`);
            }
        });
    } catch (error) {
        console.log(`❌ Error reading vnext.config.json: ${error.message}`);
    }
} else {
    console.log(`❌ vnext.config.json not found: ${configPath}`);
    console.log('⚠️  This extension requires vnext.config.json to work properly!');
}

// Test 2: Proje yapısını kontrol et
console.log('\n🏗️ Test 2: Checking project structure...');

function checkProjectStructure() {
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        const componentsRoot = path.join(workspaceRoot, config.paths.componentsRoot);
        console.log(`📁 Components root: ${componentsRoot}`);
        
        const componentTypes = [
            { name: 'Tasks', path: config.paths.tasks },
            { name: 'Views', path: config.paths.views },
            { name: 'Functions', path: config.paths.functions },
            { name: 'Extensions', path: config.paths.extensions },
            { name: 'Workflows', path: config.paths.workflows },
            { name: 'Schemas', path: config.paths.schemas }
        ];
        
        let existingComponents = 0;
        let totalCSXFiles = 0;
        let totalJSONFiles = 0;
        
        componentTypes.forEach(component => {
            const componentPath = path.join(componentsRoot, component.path);
            const srcPath = path.join(componentPath, 'src');
            
            if (fs.existsSync(componentPath)) {
                existingComponents++;
                console.log(`✅ ${component.name}: ${componentPath}`);
                
                // JSON dosyalarını say
                try {
                    const jsonFiles = fs.readdirSync(componentPath).filter(f => f.endsWith('.json'));
                    totalJSONFiles += jsonFiles.length;
                    console.log(`   📄 JSON files: ${jsonFiles.length}`);
                } catch (error) {
                    console.log(`   ❌ Error reading component directory: ${error.message}`);
                }
                
                // /src klasörünü kontrol et
                if (fs.existsSync(srcPath)) {
                    const csxFiles = findCSXFilesRecursive(srcPath);
                    totalCSXFiles += csxFiles.length;
                    console.log(`   📁 /src directory exists`);
                    console.log(`   📄 CSX files: ${csxFiles.length}`);
                    
                    if (csxFiles.length > 0) {
                        console.log('   📋 CSX files found:');
                        csxFiles.forEach(file => {
                            const relativePath = path.relative(srcPath, file);
                            console.log(`      - ${relativePath}`);
                        });
                    }
                } else {
                    console.log(`   ❌ /src directory not found: ${srcPath}`);
                }
            } else {
                console.log(`❌ ${component.name}: ${componentPath} (not found)`);
            }
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   - Existing components: ${existingComponents}/${componentTypes.length}`);
        console.log(`   - Total CSX files: ${totalCSXFiles}`);
        console.log(`   - Total JSON files: ${totalJSONFiles}`);
        
        return { existingComponents, totalCSXFiles, totalJSONFiles };
        
    } catch (error) {
        console.log(`❌ Error checking project structure: ${error.message}`);
        return null;
    }
}

function findCSXFilesRecursive(dir) {
    const csxFiles = [];
    
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                csxFiles.push(...findCSXFilesRecursive(fullPath));
            } else if (item.isFile() && item.name.endsWith('.csx')) {
                csxFiles.push(fullPath);
            }
        }
    } catch (error) {
        console.log(`❌ Error reading directory ${dir}: ${error.message}`);
    }
    
    return csxFiles;
}

const structureResult = checkProjectStructure();

// Test 3: CSX-JSON mapping'i kontrol et
console.log('\n🔍 Test 3: Checking CSX-JSON mappings...');

if (structureResult && structureResult.totalCSXFiles > 0) {
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        const componentsRoot = path.join(workspaceRoot, config.paths.componentsRoot);
        
        let totalMappings = 0;
        
        // Her component türünü kontrol et
        Object.entries(config.paths).forEach(([key, value]) => {
            if (key === 'componentsRoot') return;
            
            const componentPath = path.join(componentsRoot, value);
            const srcPath = path.join(componentPath, 'src');
            
            if (fs.existsSync(componentPath) && fs.existsSync(srcPath)) {
                console.log(`\n🔍 Checking ${key} component...`);
                
                // JSON dosyalarını bul
                const jsonFiles = fs.readdirSync(componentPath)
                    .filter(f => f.endsWith('.json'))
                    .map(f => path.join(componentPath, f));
                
                // CSX dosyalarını bul
                const csxFiles = findCSXFilesRecursive(srcPath);
                
                // Her CSX dosyası için JSON dosyalarını kontrol et
                csxFiles.forEach(csxFile => {
                    const csxFileName = path.basename(csxFile);
                    let foundMappings = 0;
                    
                    // CSX dosyasının src klasörünün parent klasöründeki JSON dosyalarını da bul
                    const csxSrcDir = path.dirname(csxFile);
                    const csxParentDir = path.dirname(csxSrcDir);
                    
                    // Hem component root hem de CSX parent klasöründeki JSON dosyalarını kontrol et
                    const allJsonFiles = [...jsonFiles];
                    
                    // CSX parent klasöründeki JSON dosyalarını ekle (eğer farklıysa)
                    if (csxParentDir !== componentPath && fs.existsSync(csxParentDir)) {
                        try {
                            const parentJsonFiles = fs.readdirSync(csxParentDir)
                                .filter(f => f.endsWith('.json'))
                                .map(f => path.join(csxParentDir, f));
                            
                            parentJsonFiles.forEach(pf => {
                                if (!allJsonFiles.includes(pf)) {
                                    allJsonFiles.push(pf);
                                }
                            });
                        } catch (error) {
                            // Ignore errors
                        }
                    }
                    
                    allJsonFiles.forEach(jsonFile => {
                        try {
                            const jsonContent = fs.readFileSync(jsonFile, 'utf8');
                            const relativePath = path.relative(path.dirname(jsonFile), csxFile).replace(/\\/g, '/');
                            const locationPattern = relativePath.startsWith('../') ? relativePath : `./${relativePath}`;
                            
                            if (jsonContent.includes(`"${locationPattern}"`)) {
                                foundMappings++;
                                totalMappings++;
                                console.log(`   ✅ ${csxFileName} → ${path.basename(jsonFile)}`);
                                console.log(`      Location: ${locationPattern}`);
                                console.log(`      JSON Path: ${path.relative(workspaceRoot, jsonFile)}`);
                                
                                // Base64 code kontrolü
                                const jsonData = JSON.parse(jsonContent);
                                const hasCode = JSON.stringify(jsonData).includes('"code":"');
                                console.log(`      Has base64 code: ${hasCode ? '✅' : '❌'}`);
                            }
                        } catch (error) {
                            console.log(`   ❌ Error reading ${path.basename(jsonFile)}: ${error.message}`);
                        }
                    });
                    
                    if (foundMappings === 0) {
                        console.log(`   ⚠️  ${csxFileName} - No JSON mappings found`);
                        console.log(`      CSX Path: ${path.relative(workspaceRoot, csxFile)}`);
                        console.log(`      Checked ${allJsonFiles.length} JSON files`);
                    }
                });
            }
        });
        
        console.log(`\n📊 Total CSX-JSON mappings found: ${totalMappings}`);
        
    } catch (error) {
        console.log(`❌ Error checking mappings: ${error.message}`);
    }
} else {
    console.log('⚠️  No CSX files found to check mappings');
}

// Test 4: Base64 conversion test
console.log('\n🔄 Test 4: Testing Base64 conversion...');

if (structureResult && structureResult.totalCSXFiles > 0) {
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        const componentsRoot = path.join(workspaceRoot, config.paths.componentsRoot);
        
        // İlk CSX dosyasını bul ve test et
        let testFile = null;
        
        Object.entries(config.paths).forEach(([key, value]) => {
            if (key === 'componentsRoot' || testFile) return;
            
            const srcPath = path.join(componentsRoot, value, 'src');
            if (fs.existsSync(srcPath)) {
                const csxFiles = findCSXFilesRecursive(srcPath);
                if (csxFiles.length > 0) {
                    testFile = csxFiles[0];
                }
            }
        });
        
        if (testFile) {
            const content = fs.readFileSync(testFile, 'utf8');
            const base64 = Buffer.from(content, 'utf8').toString('base64');
            
            console.log(`✅ Successfully converted ${path.basename(testFile)} to base64`);
            console.log(`📄 File path: ${testFile}`);
            console.log(`📄 Original size: ${content.length} chars`);
            console.log(`📄 Base64 size: ${base64.length} chars`);
            console.log(`🔍 Base64 preview: ${base64.substring(0, 50)}...`);
        } else {
            console.log('❌ No CSX files found for testing');
        }
        
    } catch (error) {
        console.log(`❌ Error in base64 conversion test: ${error.message}`);
    }
} else {
    console.log('⚠️  No CSX files found for base64 testing');
}

// Test 5: Extension yapısını kontrol et
console.log('\n📦 Test 5: Checking extension structure...');
const extensionPath = __dirname; // Mevcut dizin
const requiredFiles = [
    'package.json',
    'out/extension.js',
    'src/extension.ts',
    'tsconfig.json',
    'README.md',
    'csx-json-sync-1.0.0.vsix'
];

requiredFiles.forEach(file => {
    const filePath = path.join(extensionPath, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING!`);
    }
});

console.log('\n🎉 Test completed!');
console.log('\n📋 Next steps to use the extension:');
console.log('1. Install the VSIX package:');
console.log('   code --install-extension csx-json-sync-1.0.0.vsix');
console.log('2. Open VSCode in your VNext project directory');
console.log('3. Ensure vnext.config.json exists in project root');
console.log('4. Try editing a CSX file in any component/src/ directory');
console.log('5. Check if JSON files are automatically updated');
console.log('\n🔧 Manual testing commands:');
console.log('- Ctrl+Shift+P → "Sync Current CSX File to JSON"');
console.log('- Ctrl+Shift+P → "Sync All CSX Files to JSON"');
console.log('- Right-click on CSX file → "Sync Current CSX File to JSON"');
console.log('\n📊 Extension Output Channel:');
console.log('- View → Output → Select "CSX-JSON Sync" to see logs');