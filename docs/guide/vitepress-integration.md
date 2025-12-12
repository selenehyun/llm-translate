# VitePress Integration

llm-translate provides helper functions to automatically generate VitePress i18n configuration based on your translated document structure.

## Overview

After translating your documentation with `llm-translate dir`, you can use the built-in VitePress helpers to auto-generate navigation and sidebar configuration for each locale.

## Installation

```bash
npm install @llm-translate/cli
```

## Basic Usage

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateLocaleConfig } from '@llm-translate/cli';

// Get docs directory path relative to this config file
const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(__dirname, '..');

const locales = generateLocaleConfig(docsDir, {
  defaultLocale: 'en',
  locales: ['ko', 'ja'],
});

export default defineConfig({
  title: 'My Project',
  locales,
});
```

::: tip Why use absolute paths?
VitePress config runs from the project root, so relative paths like `'./docs'` may not resolve correctly. Using `import.meta.url` ensures the path is calculated relative to the config file location.
:::

This will:
1. Scan your `./docs` directory structure
2. Auto-detect sidebar directories (guide, api, cli, etc.)
3. Generate nav and sidebar for each locale
4. Apply default translations for UI elements

## Configuration Options

```typescript
interface GenerateOptions {
  /** Default locale code (e.g., 'en') - defaults to 'en' */
  defaultLocale?: string;

  /** List of locale codes to generate (auto-detected if omitted) */
  locales?: string[];

  /** Locale display labels */
  labels?: Record<string, string>;

  /** Locale lang codes for HTML */
  langCodes?: Record<string, string>;

  /** Locale descriptions */
  descriptions?: Record<string, string>;

  /** Directories to include in sidebar (auto-detected if omitted) */
  sidebarDirs?: string[];

  /** Use title from file's first heading (default: true) */
  useTitleFromHeading?: boolean;

  /** Custom locale translations */
  translations?: Record<string, LocaleTranslations>;
}
```

## Examples

### Auto-detect Locales

```typescript
import { generateLocaleConfig, detectLocales } from '@llm-translate/cli';

// Automatically detect locales from directory structure
// (looks for 2-letter directories like 'ko', 'ja', 'zh')
const locales = generateLocaleConfig('./docs');
```

### Custom Labels and Descriptions

```typescript
const locales = generateLocaleConfig('./docs', {
  defaultLocale: 'en',
  locales: ['ko', 'ja'],
  labels: {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
  },
  descriptions: {
    en: 'Documentation for My Project',
    ko: 'My Project 문서',
    ja: 'My Projectのドキュメント',
  },
});
```

### Specify Sidebar Directories

```typescript
const locales = generateLocaleConfig('./docs', {
  sidebarDirs: ['guide', 'api', 'examples'],
});
```

### Custom Translations

```typescript
const locales = generateLocaleConfig('./docs', {
  translations: {
    ko: {
      editLinkText: 'GitHub에서 편집',
      docFooter: { prev: '이전', next: '다음' },
      outline: { label: '목차' },
    },
  },
});
```

## Sidebar-Only Generation

If you want to manually configure nav but auto-generate sidebar:

```typescript
import { defineConfig } from 'vitepress';
import { generateSidebarConfig } from '@llm-translate/cli';

const sidebars = generateSidebarConfig('./docs', {
  defaultLocale: 'en',
  locales: ['ko'],
});

export default defineConfig({
  locales: {
    root: {
      label: 'English',
      themeConfig: {
        nav: [/* custom nav */],
        sidebar: sidebars.root,
      },
    },
    ko: {
      label: '한국어',
      themeConfig: {
        nav: [/* custom nav */],
        sidebar: sidebars.ko,
      },
    },
  },
});
```

## Single Locale Generation

Generate config for a single locale:

```typescript
import { generateLocale } from '@llm-translate/cli';

const koConfig = generateLocale('./docs', 'ko', {
  defaultLocale: 'en',
});

// Use in your config
export default defineConfig({
  locales: {
    ko: koConfig,
  },
});
```

## Utility Functions

### detectLocales

Auto-detect available locales by scanning for locale directories:

```typescript
import { detectLocales } from '@llm-translate/cli';

const locales = detectLocales('./docs', 'en');
// Returns: ['ko', 'ja', 'zh'] (based on directories found)
```

### detectSidebarDirs

Auto-detect directories that should appear in the sidebar:

```typescript
import { detectSidebarDirs } from '@llm-translate/cli';

const dirs = detectSidebarDirs('./docs');
// Returns: ['guide', 'api', 'cli'] (excludes locale dirs, assets, etc.)
```

## Title Extraction

The helper extracts page titles in this order:
1. Frontmatter `title` field
2. First `#` heading in the file
3. File name converted to Title Case

Example frontmatter:
```yaml
---
title: Getting Started
---
```

## Default Translations

Built-in translations are provided for common locales:

| Locale | Label | Doc Footer | Outline |
|--------|-------|------------|---------|
| ko | 한국어 | 이전/다음 페이지 | 목차 |
| ja | 日本語 | 前/次のページ | 目次 |
| zh | 中文 | 上/下一页 | 目录 |

## Workflow

Typical workflow for multilingual documentation:

```bash
# 1. Write documentation in English
docs/
  guide/
    getting-started.md
    configuration.md
  api/
    index.md

# 2. Translate to Korean
llm-translate dir ./docs ./docs/ko --target-lang ko --glossary glossary.json

# 3. Update VitePress config to use auto-generation
# (see examples above)

# 4. Build and preview
npm run docs:build
npm run docs:preview
```

## Caveats

- **Use absolute paths**: Always resolve the docs directory path using `import.meta.url` as shown in Basic Usage. Relative paths may not work correctly since VitePress runs from the project root.
- Locale directories must use 2-letter codes (e.g., `ko`, `ja`, `zh`)
- The helper assumes translated docs mirror the source structure
- Custom nav items (external links, dropdowns) need manual configuration
