# 제공자

다양한 AI 서비스를 위한 LLM 제공자 구현입니다.

## 개요

모든 제공자는 `LLMProvider` 인터페이스를 구현합니다:

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

## Claude 제공자

권장되는 제공자이며, 프롬프트 캐싱을 완벽하게 지원합니다.

### 설정

```typescript
import { createClaudeProvider } from '@llm-translate/cli';

const provider = createClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-haiku-4-5-20251001',
});
```

### 구성

```typescript
interface ClaudeProviderConfig {
  apiKey?: string;          // Defaults to ANTHROPIC_API_KEY env
  baseUrl?: string;         // Custom API endpoint
  defaultModel?: string;    // Default: claude-haiku-4-5-20251001
}
```

### 사용 가능한 모델

| 모델 | 컨텍스트 | 입력 비용 | 출력 비용 |
|-------|---------|------------|-------------|
|`claude-haiku-4-5-20251001`| 200K | $0.001/1K | $0.005/1K |
|`claude-sonnet-4-5-20250929`| 200K | $0.003/1K | $0.015/1K |
|`claude-opus-4-5-20251101`| 200K | $0.015/1K | $0.075/1K |

### 프롬프트 캐싱

Claude 제공자는 프롬프트 캐싱을 자동으로 지원합니다:

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

## OpenAI 제공자

### 설정

```typescript
import { createOpenAIProvider } from '@llm-translate/cli';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o-mini',
});
```

### 구성

```typescript
interface OpenAIProviderConfig {
  apiKey?: string;          // Defaults to OPENAI_API_KEY env
  baseUrl?: string;         // Custom API endpoint
  defaultModel?: string;    // Default: gpt-4o-mini
  organization?: string;    // OpenAI organization ID
}
```

### 사용 가능한 모델

| 모델 | 컨텍스트 | 입력 비용 | 출력 비용 |
|-------|---------|------------|-------------|
|`gpt-4o-mini`| 128K | $0.00015/1K | $0.0006/1K |
|`gpt-4o`| 128K | $0.0025/1K | $0.01/1K |
|`gpt-4-turbo`| 128K | $0.01/1K | $0.03/1K |

### 자동 캐싱

OpenAI는 1024 토큰 이상의 프롬프트에 대해 캐싱을 자동으로 처리합니다.

## Ollama 제공자

로컬 자체 호스팅 모델용입니다.

### 설정

```typescript
import { createOllamaProvider } from '@llm-translate/cli';

const provider = createOllamaProvider({
  baseUrl: 'http://localhost:11434',
  defaultModel: 'llama3.1',
});
```

### 구성

```typescript
interface OllamaProviderConfig {
  baseUrl?: string;         // Default: http://localhost:11434
  defaultModel?: string;    // Default: llama3.1
}
```

### 사용 가능한 모델

Ollama 설치에서 사용 가능한 모든 모델:

```bash
# List available models
ollama list

# Pull a model
ollama pull llama3.1
ollama pull mistral
ollama pull codellama
```

### 제한 사항

- 프롬프트 캐싱 지원 없음
- 모델에 따라 품질이 다름
- 제한된 컨텍스트 윈도우 (모델 종속)

## 제공자 인터페이스

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

## 사용자 정의 제공자

자신의 제공자를 구현합니다:

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

## 제공자 선택 가이드

| 사용 사례 | 권장 제공자 | 모델 |
|----------|---------------------|-------|
| 비용 효율적 | Claude | Haiku 4.5 |
| 높은 품질 | Claude | Sonnet 4.5 |
| OpenAI 생태계 | OpenAI | GPT-4o |
| 예산 제약 | OpenAI | GPT-4o-mini |
| 개인정보 보호/오프라인 | Ollama | Llama 3.1 |
| 엔터프라이즈 | Claude/OpenAI | 다양함 |

## 오류 처리

모든 제공자는 `TranslationError` 을 발생시킵니다:

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
