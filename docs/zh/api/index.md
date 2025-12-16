# API 参考

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

llm-translate 可以在您的 Node.js 应用程序中以编程方式使用。

## 安装

```bash
npm install @llm-translate/cli
```

## 快速开始

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

## 核心类

### [TranslationEngine](./engine)

翻译操作的主要入口点。

```typescript
const engine = new TranslationEngine(options);
await engine.translateFile({ input, output, targetLang });
await engine.translateContent(content, options);
```

### [TranslationAgent](./agent)

带有 Self-Refine 循环的低级翻译代理。

```typescript
const agent = new TranslationAgent({ provider, qualityThreshold });
const result = await agent.translate(request);
```

### [Providers](./providers)

LLM 提供商实现。

```typescript
import {
  createClaudeProvider,
  createOpenAIProvider,
  createOllamaProvider,
} from '@llm-translate/cli';
```

## 类型导出

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

## 实用函数

### Chunking

```typescript
import { chunkContent, chunkMarkdown } from '@llm-translate/cli';

const chunks = chunkContent(text, { maxTokens: 1024 });
const mdChunks = chunkMarkdown(markdown, { maxTokens: 1024 });
```

### 术语表

```typescript
import { loadGlossary, resolveGlossary, createGlossaryLookup } from '@llm-translate/cli';

const glossary = await loadGlossary('./glossary.json');
const resolved = resolveGlossary(glossary, 'ko');
const lookup = createGlossaryLookup(resolved);

const terms = lookup.findAll(sourceText);
```

### 令牌估算

```typescript
import { estimateTokens, calculateTokenBudget } from '@llm-translate/cli';

const tokens = estimateTokens(text);
const budget = calculateTokenBudget(text, { glossaryTokens: 500 });
```

## 错误处理

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

## 错误代码

| 代码 | 描述 |
|------|-------------|
|`FILE_NOT_FOUND`| 输入文件不存在 |
|`INVALID_CONFIG`| 配置验证失败 |
|`GLOSSARY_NOT_FOUND`| 术语表文件未找到 |
|`GLOSSARY_INVALID`| 术语表验证失败 |
|`PROVIDER_AUTH_FAILED`| API 密钥无效 |
|`PROVIDER_RATE_LIMITED`| 超出速率限制 |
|`PROVIDER_ERROR`| 一般提供商错误 |
|`QUALITY_THRESHOLD_NOT_MET`| 翻译质量低于阈值 |
|`PARSE_ERROR`| 文档解析失败 |
