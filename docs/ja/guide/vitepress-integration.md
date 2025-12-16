# VitePress統合

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

llm-translateは、翻訳されたドキュメント構造に基づいてVitePress i18n設定を自動生成するヘルパー関数を提供します。

## 概要

`llm-translate dir` でドキュメントを翻訳した後、組み込みのVitePressヘルパーを使用して、各ロケールのナビゲーションとサイドバー設定を自動生成できます。

## インストール

```bash
npm install @llm-translate/cli
```

## 基本的な使用方法

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

::: tip 絶対パスを使用する理由
VitePress設定はプロジェクトルートから実行されるため、 `'./docs'` のような相対パスは正しく解決されない場合があります。 `import.meta.url` を使用することで、設定ファイルの場所を基準としたパスが確実に計算されます。
:::

これにより以下が実行されます：
1. `./docs` ディレクトリ構造をスキャン
2. サイドバーディレクトリ（guide、api、cliなど）を自動検出
3. 各ロケールのnavとsidebarを生成
4. UI要素にデフォルト翻訳を適用

## 設定オプション

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

## 例

### ロケールの自動検出

```typescript
import { generateLocaleConfig, detectLocales } from '@llm-translate/cli';

// Automatically detect locales from directory structure
// (looks for 2-letter directories like 'ko', 'ja', 'zh')
const locales = generateLocaleConfig('./docs');
```

### カスタムラベルと説明

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

### サイドバーディレクトリの指定

```typescript
const locales = generateLocaleConfig('./docs', {
  sidebarDirs: ['guide', 'api', 'examples'],
});
```

### カスタム翻訳

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

## サイドバーのみの生成

navを手動で設定し、sidebarのみを自動生成したい場合：

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

## 単一ロケールの生成

単一ロケールの設定を生成：

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

## ユーティリティ関数

### detectLocales

ロケールディレクトリをスキャンして利用可能なロケールを自動検出：

```typescript
import { detectLocales } from '@llm-translate/cli';

const locales = detectLocales('./docs', 'en');
// Returns: ['ko', 'ja', 'zh'] (based on directories found)
```

### detectSidebarDirs

サイドバーに表示すべきディレクトリを自動検出：

```typescript
import { detectSidebarDirs } from '@llm-translate/cli';

const dirs = detectSidebarDirs('./docs');
// Returns: ['guide', 'api', 'cli'] (excludes locale dirs, assets, etc.)
```

## タイトル抽出

ヘルパーは以下の順序でページタイトルを抽出します：
1. フロントマターの `title` フィールド
2. ファイル内の最初の `#` 見出し
3. タイトルケースに変換されたファイル名

フロントマターの例：
```yaml
---
title: Getting Started
---
```

## デフォルト翻訳

一般的なロケールには組み込み翻訳が提供されています：

| ロケール | ラベル | ドキュメントフッター | アウトライン |
|--------|-------|------------|---------|
| ko | 한국어 | 이전/다음 페이지 | 목차 |
| ja | 日本語 | 前/次のページ | 目次 |
| zh | 中文 | 上/下一页 | 目录 |

## ワークフロー

多言語ドキュメントの典型的なワークフロー：

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

## 注意事項

- **絶対パスを使用**：基本的な使用方法で示されているように、 `import.meta.url` を使用してdocsディレクトリパスを常に解決してください。VitePressはプロジェクトルートから実行されるため、相対パスは正しく動作しない場合があります。
- ロケールディレクトリは2文字コードを使用する必要があります（例：`ko ` 、`ja ` 、`zh`）
- ヘルパーは翻訳されたドキュメントがソース構造を反映していることを前提としています
- カスタムnavアイテム（外部リンク、ドロップダウン）は手動設定が必要です
