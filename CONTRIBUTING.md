# Contributing to Maze Mind

Thank you for your interest in contributing to Maze Mind! This document provides guidelines and instructions for contributing.

## 🎯 Ways to Contribute

- 🐛 **Bug Reports**: Report bugs via GitHub Issues
- ✨ **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve or add documentation
- 💻 **Code Contributions**: Submit bug fixes or new features
- 🧪 **Testing**: Help test features and report issues
- 🎨 **Design**: Improve UI/UX or visual assets

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/maze-mind.git
cd maze-mind
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 📋 Development Guidelines

### Code Style

- **Language**: TypeScript (strict mode enabled)
- **Formatting**: 2 spaces indentation
- **Naming**:
  - Classes: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `PascalCase.ts` for classes, `camelCase.ts` for utilities

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(agent): add meta-reflection generation

Implements recursive reflection system that generates
higher-order insights from first-order reflections.

Closes #42
```

```
fix(ui): prevent panel clipping at screen edges

Increased edge padding from 10px to 20px to account
for border rendering in PanelDragManager.
```

### File Structure

When adding new features:

```
src/
├── agent/          # Agent cognitive systems
├── systems/        # Game systems (multi-agent, world, etc.)
├── ui/             # UI components
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── utils/          # Utility functions
```

### Testing

Before submitting a PR:

```bash
# Build the project
npm run build

# Run the development server
npm run dev

# Test in browser (http://localhost:3001)
```

## 🎯 Priority Areas

We especially welcome contributions in these areas:

### 1. Evaluation Framework
- Implement ablation study execution
- Add automated believability metrics
- Create end-to-end simulation runner

### 2. Large-Scale Multi-Agent
- Optimize for 25+ agents
- Implement group coordination algorithms
- Add social network analysis

### 3. Environment Enhancements
- Create new room templates
- Add dynamic object state changes
- Implement weather/time-of-day effects

### 4. Emergent Behavior Detection
- Pattern recognition algorithms
- Social norm formation tracking
- Leadership emergence detection

### 5. Performance Optimization
- Memory management improvements
- Rendering optimizations
- LLM call batching and caching

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Node version
6. **Screenshots**: If applicable
7. **Console Errors**: Any error messages

**Template:**
```markdown
## Bug Description
[Clear description]

## Steps to Reproduce
1. Start dev server
2. Press 'G' key
3. Observe behavior

## Expected Behavior
Location tree panel should toggle

## Actual Behavior
All panels toggle instead

## Environment
- Browser: Chrome 120
- OS: macOS 14
- Node: v18.17.0

## Console Errors
[Paste any errors]
```

## ✨ Feature Requests

When requesting features:

1. **Use Case**: Describe the problem or use case
2. **Proposed Solution**: Your suggested implementation
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## 📝 Pull Request Process

### 1. Before Submitting

- [ ] Code follows project style guidelines
- [ ] Commit messages follow conventional commits
- [ ] Code builds without errors (`npm run build`)
- [ ] Feature works in browser (tested locally)
- [ ] Documentation updated (if needed)
- [ ] No merge conflicts with `main` branch

### 2. PR Description

Include in your PR:

- **Summary**: What does this PR do?
- **Changes**: List of changes made
- **Testing**: How did you test this?
- **Screenshots**: For UI changes
- **Related Issues**: Link to issues (e.g., "Closes #42")

**Template:**
```markdown
## Summary
Adds meta-reflection generation to reflection system

## Changes
- Implemented recursive reflection algorithm
- Added meta-reflection UI panel
- Updated reflection tree visualization

## Testing
- Tested with 3 agents running for 2 hours
- Verified meta-reflections generate correctly
- Confirmed UI displays properly

## Screenshots
[Add screenshots]

## Related Issues
Closes #42
```

### 3. Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## 🤝 Code of Conduct

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Provide constructive feedback
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what's best for the community
- ❌ No harassment or discriminatory behavior
- ❌ No trolling or personal attacks

### Enforcement

Violations may result in:
1. Warning from maintainers
2. Temporary ban from contributing
3. Permanent ban for severe violations

## 📞 Contact

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Email**: [your-email@example.com] (for sensitive matters)

## 📜 License

By contributing to Maze Mind, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Maze Mind! 🎉
