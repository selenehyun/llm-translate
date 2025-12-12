# API Reference

llm-translate can be used programmatically in your Node.js applications.

## Installation

```bash
npm install @llm-translate/cli
```

## Quick Start

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

## Core Classes

### [TranslationEngine](./engine)

Main entry point for translation operations.

```typescript
const engine = new TranslationEngine(options);
await engine.translateFile({ input, output, targetLang });
await engine.translateContent(content, options);
```

### [TranslationAgent](./agent)

Low-level translation agent with Self-Refine loop.

```typescript
const agent = new TranslationAgent({ provider, qualityThreshold });
const result = await agent.translate(request);
```

### [Providers](./providers)

LLM provider implementations.

```typescript
import {
  createClaudeProvider,
  createOpenAIProvider,
  createOllamaProvider,
} from '@llm-translate/cli';
```

## Type Exports

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

## Utility Functions

### Chunking

```typescript
import { chunkContent, chunkMarkdown } from '@llm-translate/cli';

const chunks = chunkContent(text, { maxTokens: 1024 });
const mdChunks = chunkMarkdown(markdown, { maxTokens: 1024 });
```

### Glossary

```typescript
import { loadGlossary, resolveGlossary, createGlossaryLookup } from '@llm-translate/cli';

const glossary = await loadGlossary('./glossary.json');
const resolved = resolveGlossary(glossary, 'ko');
const lookup = createGlossaryLookup(resolved);

const terms = lookup.findAll(sourceText);
```

### Token Estimation

```typescript
import { estimateTokens, calculateTokenBudget } from '@llm-translate/cli';

const tokens = estimateTokens(text);
const budget = calculateTokenBudget(text, { glossaryTokens: 500 });
```

## Error Handling

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

## Error Codes

| Code | Description |
|------|-------------|
| `FILE_NOT_FOUND` | Input file does not exist |
| `INVALID_CONFIG` | Configuration validation failed |
| `GLOSSARY_NOT_FOUND` | Glossary file not found |
| `GLOSSARY_INVALID` | Glossary validation failed |
| `PROVIDER_AUTH_FAILED` | API key invalid |
| `PROVIDER_RATE_LIMITED` | Rate limit exceeded |
| `PROVIDER_ERROR` | General provider error |
| `QUALITY_THRESHOLD_NOT_MET` | Translation quality below threshold |
| `PARSE_ERROR` | Document parsing failed |
