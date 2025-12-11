import { createAnthropic } from '@ai-sdk/anthropic';
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
  // Latest Claude 4.5 models
  'claude-sonnet-4-5-20250929': {
    maxContextTokens: 200000,
    supportsStreaming: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  'claude-opus-4-5-20251101': {
    maxContextTokens: 200000,
    supportsStreaming: true,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  'claude-haiku-4-5-20251001': {
    maxContextTokens: 200000,
    supportsStreaming: true,
    costPer1kInput: 0.001,
    costPer1kOutput: 0.005,
  },
  // Claude 4 models (previous generation)
  'claude-sonnet-4-20250514': {
    maxContextTokens: 200000,
    supportsStreaming: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  'claude-opus-4-20250514': {
    maxContextTokens: 200000,
    supportsStreaming: true,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  // Claude 3.5 models
  'claude-3-5-haiku-20241022': {
    maxContextTokens: 200000,
    supportsStreaming: true,
    costPer1kInput: 0.001,
    costPer1kOutput: 0.005,
  },
};

// Use Claude Haiku 4.5 as default for cost-efficiency
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

// ============================================================================
// Claude Provider Implementation
// ============================================================================

export class ClaudeProvider implements LLMProvider {
  readonly name: ProviderName = 'claude';
  readonly defaultModel: string;
  private readonly client: ReturnType<typeof createAnthropic>;

  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey ?? process.env['ANTHROPIC_API_KEY'];

    if (!apiKey) {
      throw new TranslationError(ErrorCode.PROVIDER_AUTH_FAILED, {
        provider: 'claude',
        message: 'ANTHROPIC_API_KEY environment variable is not set',
      });
    }

    this.client = createAnthropic({
      apiKey,
      baseURL: config.baseUrl,
    });

    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.defaultModel;

    try {
      const result = await generateText({
        model: this.client(model),
        messages: request.messages.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.3,
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

  async *stream(request: ChatRequest): AsyncIterable<string> {
    const model = request.model ?? this.defaultModel;

    try {
      const result = streamText({
        model: this.client(model),
        messages: request.messages.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.3,
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
    // Use estimation since exact counting requires API call
    return estimateTokens(text);
  }

  getModelInfo(model?: string): ModelInfo {
    const modelName = model ?? this.defaultModel;
    return (
      MODEL_INFO[modelName] ?? {
        maxContextTokens: 200000,
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
      errorMessage.includes('429')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_RATE_LIMITED, {
        provider: 'claude',
        message: errorMessage,
      });
    }

    // Check for auth errors
    if (
      errorMessage.includes('authentication') ||
      errorMessage.includes('401') ||
      errorMessage.includes('invalid_api_key')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_AUTH_FAILED, {
        provider: 'claude',
        message: errorMessage,
      });
    }

    return new TranslationError(ErrorCode.PROVIDER_ERROR, {
      provider: 'claude',
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
    case 'end_turn':
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

export function createClaudeProvider(config: ProviderConfig = {}): LLMProvider {
  return new ClaudeProvider(config);
}
