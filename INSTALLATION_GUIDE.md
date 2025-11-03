# MAZE MIND - Installation & Setup Guide

## 📦 Complete Setup Instructions

This guide will walk you through setting up Maze Mind from scratch on your Mac Mini M4.

---

## Prerequisites Checklist

Before starting, verify you have:

- ✅ **macOS** (your Mac Mini M4)
- ✅ **Homebrew** package manager
- ✅ **Node.js** 18+ and npm
- ✅ **Git** for version control
- ✅ **Code Editor** (VS Code recommended)
- ✅ **16GB RAM** (you have this)
- ✅ **Terminal** access

### Install Missing Prerequisites

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 18+ via Homebrew
brew install node

# Verify installations
node --version   # Should be v18.x or higher
npm --version    # Should be 9.x or higher
git --version    # Should be 2.x or higher
```

---

## Step 1: Create Project Directory

```bash
# Navigate to your preferred development location
cd ~/Documents  # or wherever you want the project

# Create project folder
mkdir maze-mind
cd maze-mind

# Initialize git repository
git init

# Verify you're in the right place
pwd  # Should show /Users/your-username/Documents/maze-mind
```

---

## Step 2: Setup Package Manager

```bash
# Initialize npm project
npm init -y

# This creates package.json with defaults
# We'll replace it next with the proper configuration
```

Now **replace** the contents of `package.json` with:

```json
{
  "name": "maze-mind",
  "version": "0.1.0",
  "description": "AI Agent Survival Maze Simulation - Testing AI resilience through simulated survival scenarios",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "generate-sprites": "node scripts/generate-sprites.js",
    "create-tileset": "node scripts/create-tileset.js"
  },
  "dependencies": {
    "pixi.js": "^7.3.2",
    "gsap": "^3.12.2",
    "seedrandom": "^3.0.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/seedrandom": "^3.0.5",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "@typescript-eslint/parser": "^6.7.0",
    "@vitejs/plugin-react": "^4.1.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.3",
    "typescript": "^5.2.2",
    "vite": "^4.5.0",
    "vitest": "^0.34.6",
    "@vitest/ui": "^0.34.6"
  },
  "keywords": [
    "ai",
    "simulation",
    "maze",
    "llm",
    "cognitive-architecture",
    "survival",
    "research"
  ],
  "author": "Maze Mind Research Team",
  "license": "MIT"
}
```

---

## Step 3: Install Dependencies

```bash
# Install all packages (this will take 2-3 minutes)
npm install

# You should see installation progress
# Final message should say "added XXX packages"

# Verify installations
npm list pixi.js    # Should show pixi.js@7.3.2
npm list react      # Should show react@18.2.0
npm list typescript # Should show typescript@5.2.2
```

**Expected output:**
```
added 847 packages, and audited 848 packages in 2m

found 0 vulnerabilities
```

---

## Step 4: Create Configuration Files

### Create `tsconfig.json`

```bash
# Create the file
touch tsconfig.json
```

Add this content to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "sourceMap": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@config/*": ["./src/config/*"],
      "@types/*": ["./src/types/*"],
      "@core/*": ["./src/core/*"],
      "@maze/*": ["./src/maze/*"],
      "@agent/*": ["./src/agent/*"],
      "@rendering/*": ["./src/rendering/*"],
      "@ui/*": ["./src/ui/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Create `vite.config.ts`

```bash
touch vite.config.ts
```

Add this content to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@types': path.resolve(__dirname, './src/types'),
      '@core': path.resolve(__dirname, './src/core'),
      '@maze': path.resolve(__dirname, './src/maze'),
      '@agent': path.resolve(__dirname, './src/agent'),
      '@rendering': path.resolve(__dirname, './src/rendering'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Create `.gitignore`

```bash
touch .gitignore
```

Add this content to `.gitignore`:

```
node_modules/
/build
/dist
.env
.env*.local
npm-debug.log*
.DS_Store
.vscode/
*.log
/data
/logs
```

### Create `.env.example`

```bash
touch .env.example
```

Add this content:

```
# Maze Mind Environment Variables

# WEEK 2+: LLM API Configuration
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Logging
LOG_LEVEL=info
LOG_TO_FILE=false

# Simulation
TIME_SCALE=10
DEBUG_MODE=true
```

### Create `.env` (your local version)

```bash
cp .env.example .env
# Edit .env when you need to add your API key in Week 2
```

---

## Step 5: Create Source Directory Structure

```bash
# Create all directories at once
mkdir -p src/{config,types,core,maze,agent,rendering,ui,utils}

# Create public assets structure
mkdir -p public/assets/{sprites/arth,tiles,effects,ui}

# Create documentation folder
mkdir docs

# Create scripts folder
mkdir scripts

# Create tests folder
mkdir tests

# Verify structure
tree -L 2 src  # Should show the directory tree
```

**Expected structure:**
```
src/
├── config/
├── types/
├── core/
├── maze/
├── agent/
├── rendering/
├── ui/
└── utils/
```

---

## Step 6: Add Core Type Definitions

Create `src/types/index.ts`:

```bash
touch src/types/index.ts
```

**Copy the complete content from `src-types-index.ts`** (provided in previous files).

The file should start with:
```typescript
// src/types/index.ts
/**
 * Core type definitions for Maze Mind
 */

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}
// ... rest of types
```

---

## Step 7: Add Configuration Files

### Create `src/config/arth.profile.ts`

```bash
touch src/config/arth.profile.ts
```

**Copy the complete content from `src-config-arth-profile.ts`** (provided in previous files).

### Create `src/config/game.config.ts`

```bash
touch src/config/game.config.ts
```

**Copy the complete content from `src-config-game-config.ts`** (provided in previous files).

---

## Step 8: Create Entry Point

Create `src/main.ts`:

```bash
touch src/main.ts
```

Add this minimal starter content:

```typescript
// src/main.ts
/**
 * Maze Mind - Entry Point
 */

import './styles/main.css';

console.log('🧩 Maze Mind - Initializing...');

// Week 1: We'll add game initialization here
// For now, just verify the setup works

const init = async () => {
  console.log('✅ Setup complete!');
  console.log('📦 All dependencies loaded');
  console.log('🚀 Ready to build Week 1');
};

init();
```

### Create styles

```bash
mkdir src/styles
touch src/styles/main.css
```

Add minimal CSS:

```css
/* src/styles/main.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background: #1a1a1a;
  color: #ffffff;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
}
```

---

## Step 9: Create HTML Entry Point

Create `index.html` in project root:

```bash
touch index.html
```

Add this content:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maze Mind - AI Survival Simulation</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## Step 10: First Test Run

```bash
# Start the development server
npm run dev
```

**Expected output:**
```
  VITE v4.5.0  ready in 423 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
  ➜  press h to show help
```

**Your browser should automatically open** to `http://localhost:3000`

You should see:
- Black background
- Browser console showing:
  ```
  🧩 Maze Mind - Initializing...
  ✅ Setup complete!
  📦 All dependencies loaded
  🚀 Ready to build Week 1
  ```

If you see this, **congratulations! Setup is complete!** ✅

---

## Step 11: Setup Version Control

```bash
# Check status
git status

# Add all files
git add .

# Make first commit
git commit -m "Initial setup: Configuration and types"

# (Optional) Create GitHub repository and push
git remote add origin <your-github-url>
git push -u origin main
```

---

## Step 12: Setup VS Code (Recommended)

### Install VS Code Extensions

Open VS Code and install these extensions:

1. **ESLint** - dbaeumer.vscode-eslint
2. **Prettier** - esbenp.prettier-vscode
3. **TypeScript Vue Plugin (Volar)** - Vue.volar
4. **Path Intellisense** - christian-kohler.path-intellisense

### VS Code Settings

Create `.vscode/settings.json`:

```bash
mkdir .vscode
touch .vscode/settings.json
```

Add:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## Verification Checklist

Go through this checklist to verify everything is working:

### ✅ File Structure
```bash
ls -la  # Should show all files
```

You should see:
- ✅ `node_modules/` folder
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `tsconfig.json`
- ✅ `vite.config.ts`
- ✅ `.gitignore`
- ✅ `.env`
- ✅ `index.html`
- ✅ `src/` folder

### ✅ Dependencies
```bash
npm list --depth=0
```

Should show all packages without errors.

### ✅ TypeScript
```bash
npx tsc --noEmit
```

Should complete without errors.

### ✅ Development Server
```bash
npm run dev
```

Should start without errors and open browser.

### ✅ Types
```bash
cat src/types/index.ts | grep "export enum"
```

Should show Direction, TileType, ResourceType, etc.

### ✅ Config
```bash
cat src/config/arth.profile.ts | grep "ARTH_PROFILE"
```

Should show the Arth profile object.

---

## Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Try again
npm install
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in vite.config.ts
# Change: port: 3000 → port: 3001
```

### Issue: TypeScript errors

**Solution:**
```bash
# Reinstall TypeScript
npm install --save-dev typescript

# Restart VS Code
# CMD + Shift + P → "Reload Window"
```

### Issue: Import path errors

**Solution:**
Make sure `tsconfig.json` has the correct `paths` configuration and restart VS Code.

---

## What's Next?

Now that setup is complete, you're ready to start Week 1 implementation!

### Week 1, Day 1: Maze Generation

**Your first task:**
1. Create `src/maze/MazeGenerator.ts`
2. Implement recursive backtracking algorithm
3. Test maze generation in console
4. Visualize with ASCII art

**Starter template:**
```typescript
// src/maze/MazeGenerator.ts
import seedrandom from 'seedrandom';
import { Maze, MazeConfig } from '@types/index';

export class MazeGenerator {
  generate(config: MazeConfig): Maze {
    // TODO: Implement maze generation
    console.log('Generating maze...', config);
    return {} as Maze; // Placeholder
  }
}
```

---

## Useful Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check for errors
npm run format       # Auto-format code
npm run test         # Run tests

# Git
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push             # Push to remote

# Utilities
npm list             # Show installed packages
npm outdated         # Check for updates
npm run              # List all scripts
```

---

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Verification Checklist](#verification-checklist)
3. Consult the main [PROJECT.md](PROJECT.md) documentation
4. Check Node.js and npm versions match requirements

---

## Summary

You should now have:

✅ Complete development environment setup
✅ All dependencies installed (847 packages)
✅ Project structure created (10 directories)
✅ Configuration files in place (5 files)
✅ Type definitions added (~400 lines)
✅ Core configurations added (~750 lines)
✅ Development server running on localhost:3000
✅ Version control initialized
✅ VS Code configured (optional)

**Total Setup Time**: ~15-20 minutes

**Status**: Ready to begin Week 1, Day 1 implementation! 🚀

---

**Document Version**: 1.0
**Last Updated**: November 2, 2025
**Tested On**: macOS (Apple Silicon M4)
