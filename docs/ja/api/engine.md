# TranslationEngine

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

翻訳操作のメインエントリーポイントです。

## コンストラクタ

```typescript
import { TranslationEngine } from '@llm-translate/cli';

const engine = new TranslationEngine(options: TranslationEngineOptions);
```

### オプション

```typescript
interface TranslationEngineOptions {
  provider: LLMProvider;
  qualityThreshold?: number;      // Default: 85
  maxIterations?: number;         // Default: 4
  chunkingConfig?: ChunkingConfig;
  verbose?: boolean;              // Default: false
}
```

## メソッド

### translateFile

単一ファイルを翻訳します。

```typescript
const result = await engine.translateFile(options: TranslateFileOptions);
```

#### オプション

```typescript
interface TranslateFileOptions {
  input: string;           // Input file path
  output?: string;         // Output file path (optional)
  sourceLang?: string;     // Source language (auto-detect if omitted)
  targetLang: string;      // Target language (required)
  glossary?: string | Glossary;  // Glossary path or object
  context?: {
    documentPurpose?: string;
    preserveFormatting?: boolean;
  };
}
```

#### 戻り値

```typescript
interface TranslateFileResult {
  content: string;
  outputPath?: string;
  metadata: {
    qualityScore: number;
    qualityThreshold: number;
    thresholdMet: boolean;
    iterations: number;
    tokensUsed: {
      input: number;
      output: number;
      cacheRead?: number;
      cacheWrite?: number;
    };
    duration: number;
    chunks: number;
  };
}
```

#### 例

```typescript
const result = await engine.translateFile({
  input: 'docs/guide.md',
  output: 'docs/guide.ko.md',
  targetLang: 'ko',
  glossary: './glossary.json',
  context: {
    documentPurpose: 'Technical documentation for developers',
  },
});

console.log(`Quality: ${result.metadata.qualityScore}`);
console.log(`Output: ${result.outputPath}`);
```

### translateContent

コンテンツを直接翻訳します（ファイルI/Oなし）。

```typescript
const result = await engine.translateContent(
  content: string,
  options: TranslateContentOptions
);
```

#### オプション

```typescript
interface TranslateContentOptions {
  sourceLang?: string;
  targetLang: string;
  glossary?: ResolvedGlossary;
  format?: 'markdown' | 'html' | 'text';
  context?: {
    documentPurpose?: string;
    previousChunks?: string[];
  };
}
```

#### 例

```typescript
const content = `
# Hello World

This is a **markdown** document.
`;

const result = await engine.translateContent(content, {
  targetLang: 'ko',
  format: 'markdown',
});

console.log(result.content);
// # 안녕하세요
//
// 이것은 **마크다운** 문서입니다.
```

### translateDirectory

ディレクトリ内のすべてのファイルを翻訳します。

```typescript
const results = await engine.translateDirectory(options: TranslateDirectoryOptions);
```

#### オプション

```typescript
interface TranslateDirectoryOptions {
  input: string;           // Input directory
  output: string;          // Output directory
  targetLang: string;
  glossary?: string | Glossary;
  pattern?: string;        // Glob pattern (default: '**/*.md')
  exclude?: string[];      // Patterns to exclude
  concurrency?: number;    // Parallel processing (default: 3)
  continueOnError?: boolean;
}
```

#### 戻り値

```typescript
interface TranslateDirectoryResult {
  successful: TranslateFileResult[];
  failed: Array<{
    file: string;
    error: Error;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalDuration: number;
    averageQuality: number;
  };
}
```

#### 例

```typescript
const results = await engine.translateDirectory({
  input: './docs',
  output: './docs-ko',
  targetLang: 'ko',
  glossary: './glossary.json',
  concurrency: 5,
  continueOnError: true,
});

console.log(`Translated: ${results.summary.successful}/${results.summary.total}`);
console.log(`Average quality: ${results.summary.averageQuality}`);
```

## イベント

TranslationEngineはEventEmitterを継承しています：

```typescript
engine.on('chunk:start', (data) => {
  console.log(`Starting chunk ${data.index}/${data.total}`);
});

engine.on('chunk:complete', (data) => {
  console.log(`Chunk ${data.index}: quality ${data.quality}`);
});

engine.on('file:start', (data) => {
  console.log(`Translating: ${data.file}`);
});

engine.on('file:complete', (data) => {
  console.log(`Completed: ${data.file} (${data.quality})`);
});
```

## 完全な例

```typescript
import {
  TranslationEngine,
  createClaudeProvider,
  loadGlossary,
  resolveGlossary,
} from '@llm-translate/cli';

async function translateDocs() {
  // Setup provider
  const provider = createClaudeProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModel: 'claude-sonnet-4-5-20250929',
  });

  // Load and resolve glossary
  const glossary = await loadGlossary('./glossary.json');

  // Create engine
  const engine = new TranslationEngine({
    provider,
    qualityThreshold: 90,
    maxIterations: 5,
    verbose: true,
  });

  // Track progress
  engine.on('chunk:complete', ({ index, total, quality }) => {
    console.log(`Progress: ${index}/${total} (quality: ${quality})`);
  });

  // Translate
  try {
    const result = await engine.translateFile({
      input: 'README.md',
      output: 'README.ko.md',
      targetLang: 'ko',
      glossary,
    });

    console.log('Translation complete!');
    console.log(`Quality: ${result.metadata.qualityScore}`);
    console.log(`Tokens: ${result.metadata.tokensUsed.input} in / ${result.metadata.tokensUsed.output} out`);

    if (result.metadata.tokensUsed.cacheRead) {
      console.log(`Cache hit: ${result.metadata.tokensUsed.cacheRead} tokens`);
    }
  } catch (error) {
    console.error('Translation failed:', error.message);
  }
}
```
