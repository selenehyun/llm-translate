# Providers

LLM provider implementations for different AI services.

## Overview

All providers implement the `LLMProvider` interface:

```typescript
interface LLMProvider {
  readonly name: ProviderName;
  readonly defaultModel: string;

  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<string>;
  countTokens(text: string): number;
  getModelInfo(model?: string): ModelInfo;
}
```

## Claude Provider

The recommended provider, with full support for prompt caching.

### Setup

```typescript
import { createClaudeProvider } from 'llm-translate';

const provider = createClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-haiku-4-5-20251001',
});
```

### Configuration

```typescript
interface ClaudeProviderConfig {
  apiKey?: string;          // Defaults to ANTHROPIC_API_KEY env
  baseUrl?: string;         // Custom API endpoint
  defaultModel?: string;    // Default: claude-haiku-4-5-20251001
}
```

### Available Models

| Model | Context | Input Cost | Output Cost |
|-------|---------|------------|-------------|
| `claude-haiku-4-5-20251001` | 200K | $0.001/1K | $0.005/1K |
| `claude-sonnet-4-5-20250929` | 200K | $0.003/1K | $0.015/1K |
| `claude-opus-4-5-20251101` | 200K | $0.015/1K | $0.075/1K |

### Prompt Caching

Claude provider supports prompt caching automatically:

```typescript
const response = await provider.chat({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'System instructions...',
          cacheControl: { type: 'ephemeral' },  // Cache this
        },
        {
          type: 'text',
          text: 'User content...',  // Don't cache
        },
      ],
    },
  ],
});

console.log(response.usage);
// {
//   inputTokens: 100,
//   outputTokens: 200,
//   cacheReadTokens: 500,    // Tokens read from cache
//   cacheWriteTokens: 0,     // Tokens written to cache
// }
```

## OpenAI Provider

### Setup

```typescript
import { createOpenAIProvider } from 'llm-translate';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o-mini',
});
```

### Configuration

```typescript
interface OpenAIProviderConfig {
  apiKey?: string;          // Defaults to OPENAI_API_KEY env
  baseUrl?: string;         // Custom API endpoint
  defaultModel?: string;    // Default: gpt-4o-mini
  organization?: string;    // OpenAI organization ID
}
```

### Available Models

| Model | Context | Input Cost | Output Cost |
|-------|---------|------------|-------------|
| `gpt-4o-mini` | 128K | $0.00015/1K | $0.0006/1K |
| `gpt-4o` | 128K | $0.0025/1K | $0.01/1K |
| `gpt-4-turbo` | 128K | $0.01/1K | $0.03/1K |

### Automatic Caching

OpenAI handles caching automatically for prompts > 1024 tokens.

## Ollama Provider

For local, self-hosted models.

### Setup

```typescript
import { createOllamaProvider } from 'llm-translate';

const provider = createOllamaProvider({
  baseUrl: 'http://localhost:11434',
  defaultModel: 'llama3.1',
});
```

### Configuration

```typescript
interface OllamaProviderConfig {
  baseUrl?: string;         // Default: http://localhost:11434
  defaultModel?: string;    // Default: llama3.1
}
```

### Available Models

Any model available in your Ollama installation:

```bash
# List available models
ollama list

# Pull a model
ollama pull llama3.1
ollama pull mistral
ollama pull codellama
```

### Limitations

- No prompt caching support
- Quality varies by model
- Limited context window (model-dependent)

## Provider Interface

### ChatRequest

```typescript
interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;    // Default: 0.3
  maxTokens?: number;      // Default: 4096
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | CacheableTextPart[];
}

interface CacheableTextPart {
  type: 'text';
  text: string;
  cacheControl?: { type: 'ephemeral' };
}
```

### ChatResponse

```typescript
interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  model: string;
  finishReason: 'stop' | 'length' | 'error';
}
```

### ModelInfo

```typescript
interface ModelInfo {
  maxContextTokens: number;
  supportsStreaming: boolean;
  costPer1kInput?: number;
  costPer1kOutput?: number;
}
```

## Custom Provider

Implement your own provider:

```typescript
import type { LLMProvider, ChatRequest, ChatResponse } from 'llm-translate';

class CustomProvider implements LLMProvider {
  readonly name = 'custom' as const;
  readonly defaultModel = 'custom-model';

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Your implementation
    const response = await callYourAPI(request);

    return {
      content: response.text,
      usage: {
        inputTokens: response.promptTokens,
        outputTokens: response.completionTokens,
      },
      model: request.model ?? this.defaultModel,
      finishReason: 'stop',
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<string> {
    // Streaming implementation
    for await (const chunk of streamYourAPI(request)) {
      yield chunk.text;
    }
  }

  countTokens(text: string): number {
    // Token estimation
    return Math.ceil(text.length / 4);
  }

  getModelInfo(model?: string): ModelInfo {
    return {
      maxContextTokens: 100000,
      supportsStreaming: true,
    };
  }
}
```

## Provider Selection Guide

| Use Case | Recommended Provider | Model |
|----------|---------------------|-------|
| Cost-effective | Claude | Haiku 4.5 |
| High quality | Claude | Sonnet 4.5 |
| OpenAI ecosystem | OpenAI | GPT-4o |
| Budget constrained | OpenAI | GPT-4o-mini |
| Privacy/offline | Ollama | Llama 3.1 |
| Enterprise | Claude/OpenAI | Varies |

## Error Handling

All providers throw `TranslationError`:

```typescript
import { TranslationError, ErrorCode } from 'llm-translate';

try {
  await provider.chat(request);
} catch (error) {
  if (error instanceof TranslationError) {
    switch (error.code) {
      case ErrorCode.PROVIDER_AUTH_FAILED:
        console.error('Invalid API key');
        break;
      case ErrorCode.PROVIDER_RATE_LIMITED:
        console.error('Rate limited, retry later');
        break;
      case ErrorCode.PROVIDER_ERROR:
        console.error('Provider error:', error.message);
        break;
    }
  }
}
```
