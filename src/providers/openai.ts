import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { ProviderName } from '../types/index.js';
import type {
  LLMProvider,
  ProviderConfig,
  ChatRequest,
  ChatResponse,
  ModelInfo,
} from './interface.js';
import { TranslationError, ErrorCode } from '../errors.js';
import { estimateTokens } from '../utils/tokens.js';

// ============================================================================
// Model Information
// ============================================================================

const MODEL_INFO: Record<string, ModelInfo> = {
  // GPT-4o models (latest)
  'gpt-4o': {
    maxContextTokens: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
  'gpt-4o-2024-11-20': {
    maxContextTokens: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
  'gpt-4o-2024-08-06': {
    maxContextTokens: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
  // GPT-4o mini (cost-effective)
  'gpt-4o-mini': {
    maxContextTokens: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  'gpt-4o-mini-2024-07-18': {
    maxContextTokens: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  // GPT-4 Turbo
  'gpt-4-turbo': {
    maxContextTokens: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  'gpt-4-turbo-2024-04-09': {
    maxContextTokens: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  // GPT-4 (original)
  'gpt-4': {
    maxContextTokens: 8192,
    supportsStreaming: true,
    costPer1kInput: 0.03,
    costPer1kOutput: 0.06,
  },
  // GPT-3.5 Turbo
  'gpt-3.5-turbo': {
    maxContextTokens: 16385,
    supportsStreaming: true,
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
  },
  // o1 models (reasoning)
  'o1': {
    maxContextTokens: 200000,
    supportsStreaming: false,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.06,
  },
  'o1-preview': {
    maxContextTokens: 128000,
    supportsStreaming: false,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.06,
  },
  'o1-mini': {
    maxContextTokens: 128000,
    supportsStreaming: false,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.012,
  },
};

// Use GPT-4o mini as default for cost-efficiency
const DEFAULT_MODEL = 'gpt-4o-mini';

// ============================================================================
// OpenAI Provider Implementation
// ============================================================================

export class OpenAIProvider implements LLMProvider {
  readonly name: ProviderName = 'openai';
  readonly defaultModel: string;
  private readonly client: ReturnType<typeof createOpenAI>;

  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey ?? process.env['OPENAI_API_KEY'];

    if (!apiKey) {
      throw new TranslationError(ErrorCode.PROVIDER_AUTH_FAILED, {
        provider: 'openai',
        message: 'OPENAI_API_KEY environment variable is not set',
      });
    }

    this.client = createOpenAI({
      apiKey,
      baseURL: config.baseUrl,
    });

    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.defaultModel;

    try {
      const messages = this.convertMessages(request.messages);

      const result = await generateText({
        model: this.client(model),
        messages,
        temperature: request.temperature ?? 0,
        maxTokens: request.maxTokens ?? 4096,
      });

      return {
        content: result.text,
        usage: {
          inputTokens: result.usage?.promptTokens ?? 0,
          outputTokens: result.usage?.completionTokens ?? 0,
        },
        model,
        finishReason: mapFinishReason(result.finishReason),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Convert messages to Vercel AI SDK format
   * OpenAI doesn't support cache control like Claude, so we simplify content
   */
  private convertMessages(
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<{ type: 'text'; text: string }>;
    }>
  ) {
    return messages.map((msg) => {
      // If content is an array of parts, concatenate text
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content.map((part) => part.text).join(''),
        };
      }
      return { role: msg.role, content: msg.content };
    });
  }

  async *stream(request: ChatRequest): AsyncIterable<string> {
    const model = request.model ?? this.defaultModel;
    const modelInfo = this.getModelInfo(model);

    // o1 models don't support streaming
    if (!modelInfo.supportsStreaming) {
      const response = await this.chat(request);
      yield response.content;
      return;
    }

    try {
      const messages = this.convertMessages(request.messages);

      const result = streamText({
        model: this.client(model),
        messages,
        temperature: request.temperature ?? 0,
        maxTokens: request.maxTokens ?? 4096,
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  countTokens(text: string): number {
    // Use estimation since exact counting requires tiktoken
    return estimateTokens(text);
  }

  getModelInfo(model?: string): ModelInfo {
    const modelName = model ?? this.defaultModel;
    return (
      MODEL_INFO[modelName] ?? {
        maxContextTokens: 128000,
        supportsStreaming: true,
      }
    );
  }

  private handleError(error: unknown): TranslationError {
    if (error instanceof TranslationError) {
      return error;
    }

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Check for rate limiting
    if (
      errorMessage.includes('rate_limit') ||
      errorMessage.includes('429') ||
      errorMessage.includes('Rate limit')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_RATE_LIMITED, {
        provider: 'openai',
        message: errorMessage,
      });
    }

    // Check for auth errors
    if (
      errorMessage.includes('authentication') ||
      errorMessage.includes('401') ||
      errorMessage.includes('invalid_api_key') ||
      errorMessage.includes('Incorrect API key')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_AUTH_FAILED, {
        provider: 'openai',
        message: errorMessage,
      });
    }

    // Check for quota exceeded
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('insufficient_quota')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_ERROR, {
        provider: 'openai',
        message: 'API quota exceeded. Please check your billing settings.',
      });
    }

    // Check for context length errors
    if (
      errorMessage.includes('context_length_exceeded') ||
      errorMessage.includes('maximum context length')
    ) {
      return new TranslationError(ErrorCode.CHUNK_TOO_LARGE, {
        provider: 'openai',
        message: errorMessage,
      });
    }

    return new TranslationError(ErrorCode.PROVIDER_ERROR, {
      provider: 'openai',
      message: errorMessage,
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapFinishReason(
  reason: string | null | undefined
): 'stop' | 'length' | 'error' {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
    case 'max_tokens':
      return 'length';
    default:
      return 'error';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createOpenAIProvider(config: ProviderConfig = {}): LLMProvider {
  return new OpenAIProvider(config);
}
