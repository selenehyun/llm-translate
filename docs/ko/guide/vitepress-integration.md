# VitePress 통합

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

llm-translate는 번역된 문서 구조를 기반으로 VitePress i18n 구성을 자동으로 생성하는 헬퍼 함수를 제공합니다.

## 개요

`llm-translate dir` 로 문서를 번역한 후, 내장된 VitePress 헬퍼를 사용하여 각 로케일에 대한 네비게이션 및 사이드바 구성을 자동 생성할 수 있습니다.

## 설치

```bash
npm install @llm-translate/cli
```

## 기본 사용법

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

::: tip 절대 경로를 사용하는 이유는?
VitePress 구성은 프로젝트 루트에서 실행되므로 `'./docs'` 와 같은 상대 경로는 올바르게 해석되지 않을 수 있습니다.`import.meta.url` 를 사용하면 구성 파일 위치를 기준으로 경로가 계산됩니다.
:::

이는 다음과 같은 작업을 수행합니다:
1. `./docs` 디렉토리 구조를 스캔합니다
2. 사이드바 디렉토리(guide, api, cli 등)를 자동 감지합니다
3. 각 로케일에 대한 nav 및 사이드바를 생성합니다
4. UI 요소에 대한 기본 번역을 적용합니다

## 구성 옵션

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

## 예제

### 로케일 자동 감지

```typescript
import { generateLocaleConfig, detectLocales } from '@llm-translate/cli';

// Automatically detect locales from directory structure
// (looks for 2-letter directories like 'ko', 'ja', 'zh')
const locales = generateLocaleConfig('./docs');
```

### 사용자 정의 레이블 및 설명

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

### 사이드바 디렉토리 지정

```typescript
const locales = generateLocaleConfig('./docs', {
  sidebarDirs: ['guide', 'api', 'examples'],
});
```

### 사용자 정의 번역

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

## 사이드바 전용 생성

nav는 수동으로 구성하고 사이드바만 자동 생성하려는 경우:

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

## 단일 로케일 생성

단일 로케일에 대한 구성 생성:

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

## 유틸리티 함수

### detectLocales

로케일 디렉토리를 스캔하여 사용 가능한 로케일을 자동 감지합니다:

```typescript
import { detectLocales } from '@llm-translate/cli';

const locales = detectLocales('./docs', 'en');
// Returns: ['ko', 'ja', 'zh'] (based on directories found)
```

### detectSidebarDirs

사이드바에 표시되어야 하는 디렉토리를 자동 감지합니다:

```typescript
import { detectSidebarDirs } from '@llm-translate/cli';

const dirs = detectSidebarDirs('./docs');
// Returns: ['guide', 'api', 'cli'] (excludes locale dirs, assets, etc.)
```

## 제목 추출

헬퍼는 다음 순서로 페이지 제목을 추출합니다:
1. Frontmatter `title` 필드
2. 파일의 첫 번째 `#` 헤딩
3. Title Case로 변환된 파일명

Frontmatter 예제:
```yaml
---
title: Getting Started
---
```

## 기본 번역

일반적인 로케일에 대한 내장 번역이 제공됩니다:

| 로케일 | 레이블 | 문서 푸터 | 목차 |
|--------|-------|------------|---------|
| ko | 한국어 | 이전/다음 페이지 | 목차 |
| ja | 日本語 | 前/次のページ | 目次 |
| zh | 中文 | 上/下一页 | 目录 |

## 워크플로우

다국어 문서화를 위한 일반적인 워크플로우:

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

## 주의사항

- **절대 경로 사용**: 기본 사용법에서 보여준 것처럼 항상 `import.meta.url` 를 사용하여 docs 디렉토리 경로를 해석하십시오. VitePress가 프로젝트 루트에서 실행되므로 상대 경로는 올바르게 작동하지 않을 수 있습니다.
- 로케일 디렉토리는 2글자 코드를 사용해야 합니다(예:`ko `,` ja `,` zh`)
- 헬퍼는 번역된 문서가 소스 구조를 미러링한다고 가정합니다
- 사용자 정의 nav 항목(외부 링크, 드롭다운)은 수동 구성이 필요합니다
