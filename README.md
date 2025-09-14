# CSX-JSON Sync Extension

A VSCode extension that automatically synchronizes changes in CSX files to JSON files in base64 format for VNext Workflow Engine projects.

## ✨ Features

- ✅ **Dynamic Project Structure**: Automatically reads project structure from `vnext.config.json`
- ✅ **Multi-Component Support**: Tasks, Views, Functions, Extensions, Workflows, Schemas
- ✅ **Recursive CSX Scanning**: Supports CSX files in all subdirectories under `/src`
- ✅ **Automatic Synchronization**: Automatically updates related JSON files when CSX files change
- ✅ **Base64 Conversion**: Automatically converts CSX file content to base64
- ✅ **Smart Mapping**: Automatically finds which CSX files are used in which JSON files
- ✅ **Debounce Support**: Prevents unnecessary updates during rapid changes
- ✅ **Manual Sync**: Manual synchronization available when needed

## 📋 Requirements

- ✅ **Required**: `vnext.config.json` file must exist in project root
- ✅ **Structure**: Component directories must have `/src` subdirectories
- ✅ **Format**: VNext standard project structure

### vnext.config.json Example
```json
{
  "domain": "core",
  "paths": {
    "componentsRoot": "core",
    "tasks": "Tasks",
    "views": "Views", 
    "functions": "Functions",
    "extensions": "Extensions",
    "workflows": "Workflows",
    "schemas": "Schemas"
  }
}
```

## 🏗️ Supported Project Structure

```
project-root/
├── vnext.config.json          ← Required configuration file
└── core/                      ← componentsRoot
    ├── Tasks/
    │   ├── task1.json
    │   └── src/
    │       ├── main.csx                    ✅ Supported
    │       ├── helpers/
    │       │   └── validation.csx          ✅ Supported
    │       └── utils/
    │           └── advanced/
    │               └── complex.csx         ✅ Supported
    ├── Functions/
    │   ├── function1.json
    │   └── src/
    │       ├── auth/
    │       │   ├── login.csx               ✅ Supported
    │       │   └── logout.csx              ✅ Supported
    │       └── data/
    │           └── processing.csx          ✅ Supported
    ├── Views/
    ├── Extensions/
    ├── Workflows/
    └── Schemas/
```

## 📦 Installation

### VSIX Package (Recommended)
1. Download `csx-json-sync-1.0.0.vsix` file
2. In VS Code: `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
3. Select the VSIX file and install

### Manual Installation
1. Copy extension files to `.vscode-extensions/csx-json-sync/` directory
2. Navigate to extension directory in terminal:
   ```bash
   cd .vscode-extensions/csx-json-sync
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Compile the extension:
   ```bash
   npm run compile
   ```
5. Press F5 in VSCode to run extension in debug mode

## 🚀 Usage

### Automatic Synchronization
When the extension is active, changes made to CSX files in `/src` subdirectories of all component directories in the project structure are automatically synchronized to JSON files in the same component directory.

### Manual Synchronization
- **Sync current file**: `Ctrl+Shift+P` → "Sync Current CSX File to JSON"
- **Sync all CSX files**: `Ctrl+Shift+P` → "Sync All CSX Files to JSON"
- **Right-click menu**: Right-click on CSX file and select "Sync Current CSX File to JSON"

### Auto-Sync Control
- **Enable Auto Sync**: `Ctrl+Shift+P` → "Enable Auto Sync"
- **Disable Auto Sync**: `Ctrl+Shift+P` → "Disable Auto Sync"

## ⚙️ Configuration

You can configure the following settings in VSCode Settings:

```json
{
  "csxJsonSync.enabled": true,        // Enable/disable auto-sync
  "csxJsonSync.debounceMs": 500       // Change detection delay (ms)
}
```

## 🔧 How It Works

1. **Config Reading**: Extension reads `vnext.config.json` file
2. **Structure Discovery**: Discovers project structure and finds component directories
3. **File Watcher**: Monitors all `/src/**/*.csx` files
4. **Change Detection**: When a CSX file change is detected, debounce timer starts
5. **Base64 Conversion**: CSX file content is converted to base64 format
6. **JSON Search**: Searches for references to this CSX file in JSON files in the same component directory
7. **Update**: Updates `code` fields in JSON files where references are found

### JSON Mapping Format
The extension works with the following format:
```json
{
  "location": "./src/auth/helpers/validation.csx",
  "code": "dXNpbmcgU3lzdGVtLlRocmVhZGluZy5UYXNrczsK..."
}
```

## 📊 Debug and Logging

To monitor the extension's operation:
1. Go to `View` → `Output` and select "CSX-JSON Sync" channel
2. All synchronization operations and errors are displayed here

### Log Examples
```
CSX-JSON Sync extension activated
VNext config loaded: domain=core, componentsRoot=core
Found 6 existing component directories:
  - core/Tasks
  - core/Views
  - core/Functions
  - core/Extensions
  - core/Workflows
  - core/Schemas
Auto-sync enabled for 6 component directories
File changed: core/Functions/src/auth/login.csx
Updated code for ./src/auth/login.csx in workflow.json
Auto-sync: Successfully updated 1 JSON file(s) for login.csx
```

## 🔍 Troubleshooting

### Extension not working
- Ensure the extension is active (check Output channel)
- Ensure `vnext.config.json` file exists in project root
- Verify the configuration file is in valid JSON format

### vnext.config.json not found
```
ERROR: vnext.config.json not found or invalid. This extension requires vnext.config.json to work properly.
```
- Create `vnext.config.json` file in project root
- Ensure the file is in valid JSON format

### Synchronization not working
- Ensure CSX file is in `/src` directory under a component directory
- Ensure JSON files contain correct `location` references
- Verify auto-sync is enabled
- Check that the component directory is defined in `vnext.config.json`

### Base64 encoding errors
- Ensure CSX file is saved with UTF-8 encoding
- Check file permissions

## 🛠️ Development

For detailed development instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

Quick start:

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (automatic compilation)
npm run watch

# Run in debug mode
F5 (in VSCode)

# Create VSIX package
npx vsce package
```

### VSIX Package Installation
```bash
# Create package
npx vsce package

# Install package
code --install-extension csx-json-sync-1.0.0.vsix
```

## 🧪 Testing

Run the test script to verify your project structure:

```bash
node test-extension.js
```

The test script will:
- ✅ Check for `vnext.config.json`
- ✅ Verify project structure
- ✅ Find CSX and JSON files
- ✅ Test CSX-JSON mappings
- ✅ Verify base64 conversion
- ✅ Check extension files

## 📝 Release Notes

### v1.0.0
- ✅ Dynamic project structure support (`vnext.config.json`)
- ✅ Multi-component type support
- ✅ Recursive CSX file scanning
- ✅ Enhanced file watching
- ✅ Smart relative path calculation
- ✅ Automatic project structure discovery

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- 🚀 Development setup
- 📁 Project structure
- 🔧 Development workflow
- 🧪 Testing procedures
- 📦 Building and packaging
- 📝 Submitting changes

## 📄 License

This project is licensed under the MIT License.