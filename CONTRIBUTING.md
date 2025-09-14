# Contributing to CSX-JSON Sync Extension

Thank you for your interest in contributing to the CSX-JSON Sync Extension! This guide will help you get started with development, testing, and packaging.

## 📋 Table of Contents

- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Building & Packaging](#-building--packaging)
- [Code Style](#-code-style)
- [Submitting Changes](#-submitting-changes)
- [Release Process](#-release-process)

## 🚀 Development Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **VS Code** (latest version)
- **Git**

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd csx-json-sync
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install VS Code Extension CLI (optional but recommended):**
   ```bash
   npm install -g @vscode/vsce
   ```

4. **Compile TypeScript:**
   ```bash
   npm run compile
   ```

5. **Start development:**
   ```bash
   npm run watch
   ```

## 📁 Project Structure

```
csx-json-sync/
├── src/
│   └── extension.ts           # Main extension code
├── out/                       # Compiled JavaScript output
│   ├── extension.js
│   └── extension.js.map
├── node_modules/              # Dependencies
├── package.json               # Extension manifest & dependencies
├── tsconfig.json              # TypeScript configuration
├── README.md                  # User documentation
├── CONTRIBUTING.md            # This file
├── test-extension.js          # Test script for project
```

### Key Files Explained

- **`src/extension.ts`**: Main extension logic
  - Extension activation/deactivation
  - File watching and change detection
  - CSX to Base64 conversion
  - JSON file updating
  - VNext config reading

- **`package.json`**: Extension manifest
  - Extension metadata
  - Commands and menus
  - Configuration options
  - Dependencies

- **`tsconfig.json`**: TypeScript compiler settings
- **`test-extension.js`**: Standalone test script for validating project structure

## 🔧 Development Workflow

### 1. Running in Development Mode

```bash
# Terminal 1: Watch for TypeScript changes
npm run watch

# Terminal 2: Open VS Code and press F5 to launch Extension Development Host
code .
# Then press F5 in VS Code
```

### 2. Testing Your Changes

1. **Open Extension Development Host** (F5 in VS Code)
2. **Open a VNext project** in the new window
3. **Test the extension features:**
   - Edit a CSX file in any component's `/src` directory
   - Check if JSON files are automatically updated
   - Test manual sync commands

### 3. Using the Test Script

```bash
# Run comprehensive project structure test
node test-extension.js
```

The test script validates:
- ✅ `vnext.config.json` presence and format
- ✅ Project structure discovery
- ✅ CSX and JSON file detection
- ✅ CSX-JSON mappings
- ✅ Base64 conversion
- ✅ Extension file integrity

## 🧪 Testing

### Automated Testing

Currently, the project uses a custom test script. To run tests:

```bash
# Run the test script
node test-extension.js

# The script will check:
# - vnext.config.json validation
# - Project structure analysis
# - CSX file discovery
# - JSON mapping verification
# - Base64 conversion testing
```

### Manual Testing Checklist

- [ ] Extension activates without errors
- [ ] `vnext.config.json` is properly read
- [ ] All component directories are discovered
- [ ] CSX files in nested `/src` directories are detected
- [ ] File watcher responds to CSX file changes
- [ ] JSON files are updated with correct base64 content
- [ ] Manual sync commands work
- [ ] Auto-sync can be enabled/disabled
- [ ] Output channel shows proper logging

### Test Project Setup

For testing, you need a VNext project with this structure:

```
test-project/
├── vnext.config.json
└── core/
    ├── Functions/
    │   ├── workflow.json
    │   └── src/
    │       └── test.csx
    └── Tasks/
        ├── task.json
        └── src/
            └── validation.csx
```

**Sample vnext.config.json:**
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

**Sample JSON with CSX reference:**
```json
{
  "name": "Test Workflow",
  "steps": [
    {
      "location": "./src/test.csx",
      "code": "base64-encoded-content-here"
    }
  ]
}
```

## 📦 Building & Packaging

### Development Build

```bash
# Compile TypeScript
npm run compile

# Or watch for changes
npm run watch
```

### Creating VSIX Package

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Create VSIX package
vsce package

# This creates: csx-json-sync-1.0.0.vsix
```

### Installing Your VSIX Package

```bash
# Install the extension
code --install-extension csx-json-sync-1.0.0.vsix

# Or install in VS Code:
# Ctrl+Shift+P → "Extensions: Install from VSIX..."
```

### Publishing (Maintainers Only)

```bash
# Login to Visual Studio Marketplace
vsce login <publisher-name>

# Publish to marketplace
vsce publish

# Or publish a specific version
vsce publish 1.0.1
```

## 🎨 Code Style

### TypeScript Guidelines

- Use **TypeScript strict mode**
- Follow **VS Code extension patterns**
- Use **async/await** for asynchronous operations
- Implement proper **error handling**
- Add **JSDoc comments** for public functions

### Code Formatting

```bash
# Format code (if prettier is configured)
npm run format

# Lint code (if ESLint is configured)
npm run lint
```

### Interface Definitions

Always define interfaces for complex data structures:

```typescript
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
```

## 📝 Submitting Changes

### Before Submitting

1. **Test thoroughly** using the test script and manual testing
2. **Update documentation** if you've added new features
3. **Ensure code compiles** without errors or warnings
4. **Test VSIX packaging** works correctly

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test your changes thoroughly**
5. **Commit with descriptive messages:**
   ```bash
   git commit -m "feat: add support for nested CSX directories"
   ```
6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Commit Message Format

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for test additions/changes
- `chore:` for maintenance tasks

## 🚀 Release Process

### Version Bumping

1. **Update version in package.json:**
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Update CHANGELOG.md** (if exists)

3. **Create VSIX package:**
   ```bash
   vsce package
   ```

4. **Test the package:**
   ```bash
   code --install-extension csx-json-sync-1.0.1.vsix
   ```

5. **Tag the release:**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

### Release Checklist

- [ ] Version updated in package.json
- [ ] VSIX package created and tested
- [ ] Documentation updated
- [ ] Test script passes
- [ ] Manual testing completed
- [ ] Git tag created
- [ ] Release notes prepared

## 🐛 Debugging

### VS Code Debugging

1. **Set breakpoints** in `src/extension.ts`
2. **Press F5** to launch Extension Development Host
3. **Debug in the original VS Code window**

### Output Channel Debugging

The extension logs to "CSX-JSON Sync" output channel:

```typescript
outputChannel.appendLine('Debug message here');
```

### Common Issues

**Extension not activating:**
- Check `activationEvents` in package.json
- Verify workspace contains CSX files
- Check for JavaScript errors in Developer Console

**File watcher not working:**
- Verify file patterns in `createFileSystemWatcher`
- Check file permissions
- Ensure paths are correctly resolved

**JSON not updating:**
- Verify CSX-JSON location mapping
- Check relative path calculations
- Ensure JSON files are in same component directory

## 📚 Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js File System API](https://nodejs.org/api/fs.html)

## 🤝 Getting Help

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README.md for user documentation

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CSX-JSON Sync Extension! 🎉
