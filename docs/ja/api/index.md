# API リファレンス

llm-translate は Node.js アプリケーション内でプログラム的に使用できます。

## インストール

```bash
npm install @llm-translate/cli
```

## クイックスタート

```typescript
import { TranslationEngine, createClaudeProvider } from '@llm-translate/cli';

// Create provider
const provider = createClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create engine
const engine = new TranslationEngine({
  provider,
  qualityThreshold: 85,
});

// Translate
const result = await engine.translateFile({
  input: 'README.md',
  output: 'README.ko.md',
  sourceLang: 'en',
  targetLang: 'ko',
});

console.log(result.metadata);
```

## コアクラス

### [TranslationEngine](./engine)

翻訳操作のメインエントリーポイントです。

```typescript
const engine = new TranslationEngine(options);
await engine.translateFile({ input, output, targetLang });
await engine.translateContent(content, options);
```

### [TranslationAgent](./agent)

Self-Refine ループを備えた低レベルの翻訳エージェントです。

```typescript
const agent = new TranslationAgent({ provider, qualityThreshold });
const result = await agent.translate(request);
```

### [Providers](./providers)

LLM プロバイダーの実装です。

```typescript
import {
  createClaudeProvider,
  createOpenAIProvider,
  createOllamaProvider,
} from '@llm-translate/cli';
```

## 型エクスポート

```typescript
import type {
  // Configuration
  TranslationConfig,
  ProviderConfig,

  // Requests/Results
  TranslationRequest,
  TranslationResult,

  // Glossary
  Glossary,
  GlossaryTerm,
  ResolvedGlossary,

  // Quality
  QualityEvaluation,

  // Provider
  LLMProvider,
  ChatMessage,
  ChatResponse,
} from '@llm-translate/cli';
```

## ユーティリティ関数

### Chunking

```typescript
import { chunkContent, chunkMarkdown } from '@llm-translate/cli';

const chunks = chunkContent(text, { maxTokens: 1024 });
const mdChunks = chunkMarkdown(markdown, { maxTokens: 1024 });
```

### 用語集

```typescript
import { loadGlossary, resolveGlossary, createGlossaryLookup } from '@llm-translate/cli';

const glossary = await loadGlossary('./glossary.json');
const resolved = resolveGlossary(glossary, 'ko');
const lookup = createGlossaryLookup(resolved);

const terms = lookup.findAll(sourceText);
```

### トークン推定

```typescript
import { estimateTokens, calculateTokenBudget } from '@llm-translate/cli';

const tokens = estimateTokens(text);
const budget = calculateTokenBudget(text, { glossaryTokens: 500 });
```

## エラーハンドリング

```typescript
import { TranslationError, ErrorCode } from '@llm-translate/cli';

try {
  await engine.translateFile(options);
} catch (error) {
  if (error instanceof TranslationError) {
    switch (error.code) {
      case ErrorCode.FILE_NOT_FOUND:
        // Handle missing file
        break;
      case ErrorCode.QUALITY_THRESHOLD_NOT_MET:
        // Handle quality issue
        console.log('Score:', error.details.score);
        break;
      case ErrorCode.PROVIDER_RATE_LIMITED:
        // Handle rate limit
        break;
    }
  }
}
```

## エラーコード

| コード | 説明 |
|------|-------------|
|`FILE_NOT_FOUND`| 入力ファイルが存在しません |
|`INVALID_CONFIG`| 設定の検証に失敗しました |
|`GLOSSARY_NOT_FOUND`| 用語集ファイルが見つかりません |
|`GLOSSARY_INVALID`| 用語集の検証に失敗しました |
|`PROVIDER_AUTH_FAILED`| API キーが無効です |
|`PROVIDER_RATE_LIMITED`| レート制限を超過しました |
|`PROVIDER_ERROR`| プロバイダーの一般的なエラー |
|`QUALITY_THRESHOLD_NOT_MET`| 翻訳品質が品質しきい値を下回っています |
|`PARSE_ERROR`| ドキュメント解析に失敗しました |
