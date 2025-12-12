# 提供商

不同AI服务的LLM提供商实现。

## 概述

所有提供商都实现了 `LLMProvider` 接口：

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

## Claude 提供商

推荐的提供商，完全支持提示缓存。

### 设置

```typescript
import { createClaudeProvider } from '@llm-translate/cli';

const provider = createClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-haiku-4-5-20251001',
});
```

### 配置

```typescript
interface ClaudeProviderConfig {
  apiKey?: string;          // Defaults to ANTHROPIC_API_KEY env
  baseUrl?: string;         // Custom API endpoint
  defaultModel?: string;    // Default: claude-haiku-4-5-20251001
}
```

### 可用模型

| 模型 | 上下文 | 输入成本 | 输出成本 |
|-------|---------|------------|-------------|
|`claude-haiku-4-5-20251001`| 200K | $0.001/1K | $0.005/1K |
|`claude-sonnet-4-5-20250929`| 200K | $0.003/1K | $0.015/1K |
|`claude-opus-4-5-20251101`| 200K | $0.015/1K | $0.075/1K |

### 提示缓存

Claude 提供商自动支持提示缓存：

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

## OpenAI 提供商

### 设置

```typescript
import { createOpenAIProvider } from '@llm-translate/cli';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o-mini',
});
```

### 配置

```typescript
interface OpenAIProviderConfig {
  apiKey?: string;          // Defaults to OPENAI_API_KEY env
  baseUrl?: string;         // Custom API endpoint
  defaultModel?: string;    // Default: gpt-4o-mini
  organization?: string;    // OpenAI organization ID
}
```

### 可用模型

| 模型 | 上下文 | 输入成本 | 输出成本 |
|-------|---------|------------|-------------|
|`gpt-4o-mini`| 128K | $0.00015/1K | $0.0006/1K |
|`gpt-4o`| 128K | $0.0025/1K | $0.01/1K |
|`gpt-4-turbo`| 128K | $0.01/1K | $0.03/1K |

### 自动缓存

OpenAI 为超过 1024 令牌的提示自动处理缓存。

## Ollama 提供商

用于本地、自托管模型。

### 设置

```typescript
import { createOllamaProvider } from '@llm-translate/cli';

const provider = createOllamaProvider({
  baseUrl: 'http://localhost:11434',
  defaultModel: 'llama3.1',
});
```

### 配置

```typescript
interface OllamaProviderConfig {
  baseUrl?: string;         // Default: http://localhost:11434
  defaultModel?: string;    // Default: llama3.1
}
```

### 可用模型

Ollama 安装中可用的任何模型：

```bash
# List available models
ollama list

# Pull a model
ollama pull llama3.1
ollama pull mistral
ollama pull codellama
```

### 限制

- 不支持提示缓存
- 质量因模型而异
- 上下文窗口有限（取决于模型）

## 提供商接口

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

## 自定义提供商

实现您自己的提供商：

```typescript
import type { LLMProvider, ChatRequest, ChatResponse } from '@llm-translate/cli';

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

## 提供商选择指南

| 使用场景 | 推荐提供商 | 模型 |
|----------|---------------------|-------|
| 成本效益 | Claude | Haiku 4.5 |
| 高质量 | Claude | Sonnet 4.5 |
| OpenAI 生态系统 | OpenAI | GPT-4o |
| 预算受限 | OpenAI | GPT-4o-mini |
| 隐私/离线 | Ollama | Llama 3.1 |
| 企业级 | Claude/OpenAI | 因情况而异 |

## 错误处理

所有提供商抛出 `TranslationError`：

```typescript
import { TranslationError, ErrorCode } from '@llm-translate/cli';

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
