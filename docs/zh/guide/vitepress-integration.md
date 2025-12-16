# VitePress 集成

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

llm-translate 提供辅助函数，可根据您翻译的文档结构自动生成 VitePress i18n 配置。

## 概述

使用 `llm-translate dir` 翻译文档后，您可以使用内置的 VitePress 辅助工具为每个语言环境自动生成导航和侧边栏配置。

## 安装

```bash
npm install @llm-translate/cli
```

## 基本用法

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

::: tip 为什么使用绝对路径？
VitePress 配置从项目根目录运行，因此像 `'./docs'` 这样的相对路径可能无法正确解析。使用 `import.meta.url` 确保路径相对于配置文件位置计算。
:::

这将：
1. 扫描您的 `./docs` 目录结构
2. 自动检测侧边栏目录（guide、api、cli 等）
3. 为每个语言环境生成导航和侧边栏
4. 为 UI 元素应用默认翻译

## 配置选项

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

## 示例

### 自动检测语言环境

```typescript
import { generateLocaleConfig, detectLocales } from '@llm-translate/cli';

// Automatically detect locales from directory structure
// (looks for 2-letter directories like 'ko', 'ja', 'zh')
const locales = generateLocaleConfig('./docs');
```

### 自定义标签和描述

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

### 指定侧边栏目录

```typescript
const locales = generateLocaleConfig('./docs', {
  sidebarDirs: ['guide', 'api', 'examples'],
});
```

### 自定义翻译

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

## 仅生成侧边栏

如果您想手动配置导航但自动生成侧边栏：

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

## 单一语言环境生成

为单一语言环境生成配置：

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

## 实用函数

### detectLocales

通过扫描语言环境目录自动检测可用的语言环境：

```typescript
import { detectLocales } from '@llm-translate/cli';

const locales = detectLocales('./docs', 'en');
// Returns: ['ko', 'ja', 'zh'] (based on directories found)
```

### detectSidebarDirs

自动检测应出现在侧边栏中的目录：

```typescript
import { detectSidebarDirs } from '@llm-translate/cli';

const dirs = detectSidebarDirs('./docs');
// Returns: ['guide', 'api', 'cli'] (excludes locale dirs, assets, etc.)
```

## 标题提取

辅助工具按以下顺序提取页面标题：
1. 前置元数据 `title` 字段
2. 文件中的第一个 `#` 标题
3. 转换为标题格式的文件名

前置元数据示例：
```yaml
---
title: Getting Started
---
```

## 默认翻译

为常见语言环境提供内置翻译：

| 语言环境 | 标签 | 文档页脚 | 大纲 |
|--------|-------|------------|---------|
| ko | 한국어 | 이전/다음 페이지 | 목차 |
| ja | 日本語 | 前/次のページ | 目次 |
| zh | 中文 | 上/下一页 | 目录 |

## 工作流程

多语言文档的典型工作流程：

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

## 注意事项

- **使用绝对路径**：始终使用 `import.meta.url` 解析文档目录路径，如基本用法中所示。相对路径可能无法正常工作，因为 VitePress 从项目根目录运行。
- 语言环境目录必须使用 2 字母代码（例如 `ko` 、 `ja` 、 `zh`）
- 辅助工具假设翻译文档镜像源结构
- 自定义导航项（外部链接、下拉菜单）需要手动配置
