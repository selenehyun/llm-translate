# Contributing to llm-translate

Thank you for your interest in contributing to llm-translate! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see below)
4. Create a branch for your changes
5. Make your changes and test them
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20.0.0 or higher
- npm or pnpm

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/llm-translate.git
cd llm-translate

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify setup
npm test
```

### Environment Variables

For running integration tests or manual testing, you may need API keys:

```bash
export ANTHROPIC_API_KEY=your_key_here
export OPENAI_API_KEY=your_key_here
```

**Note:** Never commit API keys. See [SECURITY.md](SECURITY.md) for API key management guidelines.

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/add-new-provider` - New features
- `fix/glossary-parsing-bug` - Bug fixes
- `docs/update-readme` - Documentation updates
- `test/add-engine-tests` - Test additions
- `refactor/improve-chunker` - Code refactoring

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(provider): add Google Gemini provider support
fix(glossary): handle empty glossary files gracefully
docs(readme): add examples for HTML translation
test(engine): add unit tests for chunking logic
```

## Code Style

### TypeScript

- Use strict TypeScript (`strict: true` in tsconfig)
- Prefer async/await over callbacks
- Export types from `src/types/index.ts`
- All public APIs must have JSDoc comments

### General Guidelines

- Use ESM modules only (no CommonJS)
- Prefer `const` over `let`
- Use meaningful variable names
- Keep functions focused and small
- Add comments for complex logic

### Running Linters

```bash
# Run ESLint
npm run lint

# Type checking
npm run typecheck
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Test Requirements

- **Coverage target:** > 80%
- Write tests for all new features
- Update tests when modifying existing features
- Use Vitest with ESM configuration

### Test Structure

```
tests/
├── unit/           # Unit tests
│   ├── core/       # Core module tests
│   ├── providers/  # Provider tests
│   └── services/   # Service tests
└── integration/    # Integration tests
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('ModuleName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Submitting Changes

### Pull Request Process

1. **Update documentation** if your changes affect public APIs
2. **Add tests** for new functionality
3. **Run the full test suite** and ensure it passes
4. **Update the README** if needed
5. **Fill out the PR template** completely

### PR Checklist

Before submitting:

- [ ] Code follows the project style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex code
- [ ] Documentation updated (if applicable)
- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] No new warnings introduced

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR

## Issue Guidelines

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS)
- Relevant error messages or logs

### Feature Requests

Include:
- Clear description of the feature
- Use case / motivation
- Proposed implementation (if any)
- Potential alternatives considered

## Questions?

If you have questions about contributing, feel free to:
- Open a GitHub Discussion
- Ask in the issue you're working on

Thank you for contributing to llm-translate!
