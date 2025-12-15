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

// Common Ollama models with their context sizes
// Note: These are estimates - actual limits depend on model variant and system memory
const MODEL_INFO: Record<string, ModelInfo> = {
  // Llama 3.x models
  'llama3.3': {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  'llama3.2': {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  'llama3.1': {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  'llama3': {
    maxContextTokens: 8192,
    supportsStreaming: true,
  },
  // Llama 2 models
  llama2: {
    maxContextTokens: 4096,
    supportsStreaming: true,
  },
  'llama2:13b': {
    maxContextTokens: 4096,
    supportsStreaming: true,
  },
  'llama2:70b': {
    maxContextTokens: 4096,
    supportsStreaming: true,
  },
  // Mistral models
  mistral: {
    maxContextTokens: 32768,
    supportsStreaming: true,
  },
  'mistral-nemo': {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  mixtral: {
    maxContextTokens: 32768,
    supportsStreaming: true,
  },
  // Qwen models
  qwen2: {
    maxContextTokens: 32768,
    supportsStreaming: true,
  },
  'qwen2.5': {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  'qwen2.5-coder': {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  // Gemma models
  gemma2: {
    maxContextTokens: 8192,
    supportsStreaming: true,
  },
  gemma: {
    maxContextTokens: 8192,
    supportsStreaming: true,
  },
  // Phi models
  phi3: {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  'phi3:mini': {
    maxContextTokens: 128000,
    supportsStreaming: true,
  },
  // Code models
  codellama: {
    maxContextTokens: 16384,
    supportsStreaming: true,
  },
  'deepseek-coder': {
    maxContextTokens: 16384,
    supportsStreaming: true,
  },
  // Other popular models
  'neural-chat': {
    maxContextTokens: 8192,
    supportsStreaming: true,
  },
  vicuna: {
    maxContextTokens: 2048,
    supportsStreaming: true,
  },
};

// Default to llama3.2 for better multilingual support
const DEFAULT_MODEL = 'llama3.2';
const DEFAULT_BASE_URL = 'http://localhost:11434';

// ============================================================================
// Ollama Provider Implementation
// ============================================================================

export class OllamaProvider implements LLMProvider {
  readonly name: ProviderName = 'ollama';
  readonly defaultModel: string;
  private readonly client: ReturnType<typeof createOpenAI>;
  private readonly baseUrl: string;

  constructor(config: ProviderConfig = {}) {
    this.baseUrl =
      config.baseUrl ??
      process.env['OLLAMA_BASE_URL'] ??
      DEFAULT_BASE_URL;

    // Ollama uses OpenAI-compatible API at /v1 endpoint
    this.client = createOpenAI({
      apiKey: 'ollama', // Ollama doesn't require an API key
      baseURL: `${this.baseUrl}/v1`,
    });

    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.defaultModel;

    try {
      await this.ensureModelAvailable(model);

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
      throw this.handleError(error, model);
    }
  }

  /**
   * Convert messages to Vercel AI SDK format
   * Ollama doesn't support cache control, so we simplify content
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

    try {
      await this.ensureModelAvailable(model);

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
      throw this.handleError(error, model);
    }
  }

  countTokens(text: string): number {
    // Use estimation for Ollama models
    return estimateTokens(text);
  }

  getModelInfo(model?: string): ModelInfo {
    const modelName = model ?? this.defaultModel;

    // Try exact match first
    if (MODEL_INFO[modelName]) {
      return MODEL_INFO[modelName];
    }

    // Try base model name (e.g., "llama3.2:7b" -> "llama3.2")
    const baseModel = modelName.split(':')[0] ?? modelName;
    if (baseModel && MODEL_INFO[baseModel]) {
      return MODEL_INFO[baseModel];
    }

    // Default fallback
    return {
      maxContextTokens: 4096,
      supportsStreaming: true,
    };
  }

  /**
   * Check if the Ollama server is running and the model is available
   */
  private async ensureModelAvailable(model: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new TranslationError(ErrorCode.PROVIDER_ERROR, {
          provider: 'ollama',
          message: `Ollama server not responding at ${this.baseUrl}`,
        });
      }

      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };
      const models = data.models ?? [];
      const modelNames = models.map((m) => m.name);

      // Check for exact match or base model match
      const modelExists = modelNames.some(
        (name) => name === model || name.startsWith(`${model}:`)
      );

      if (!modelExists) {
        throw new TranslationError(ErrorCode.PROVIDER_ERROR, {
          provider: 'ollama',
          model,
          availableModels: modelNames.slice(0, 10), // Show first 10
          message: `Model "${model}" not found. Pull it with: ollama pull ${model}`,
        });
      }
    } catch (error) {
      if (error instanceof TranslationError) {
        throw error;
      }

      // Connection refused or other network error
      throw new TranslationError(ErrorCode.PROVIDER_ERROR, {
        provider: 'ollama',
        baseUrl: this.baseUrl,
        message: `Cannot connect to Ollama server at ${this.baseUrl}. Is Ollama running?`,
      });
    }
  }

  private handleError(error: unknown, model?: string): TranslationError {
    if (error instanceof TranslationError) {
      return error;
    }

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Check for connection errors
    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('network')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_ERROR, {
        provider: 'ollama',
        baseUrl: this.baseUrl,
        message: `Cannot connect to Ollama server at ${this.baseUrl}. Is Ollama running?`,
      });
    }

    // Check for model not found
    if (
      errorMessage.includes('model') &&
      errorMessage.includes('not found')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_ERROR, {
        provider: 'ollama',
        model,
        message: `Model "${model}" not found. Pull it with: ollama pull ${model}`,
      });
    }

    // Check for context length errors
    if (
      errorMessage.includes('context') ||
      errorMessage.includes('too long')
    ) {
      return new TranslationError(ErrorCode.CHUNK_TOO_LARGE, {
        provider: 'ollama',
        model,
        message: errorMessage,
      });
    }

    // Check for out of memory
    if (
      errorMessage.includes('out of memory') ||
      errorMessage.includes('OOM')
    ) {
      return new TranslationError(ErrorCode.PROVIDER_ERROR, {
        provider: 'ollama',
        model,
        message: 'Out of memory. Try a smaller model or reduce chunk size.',
      });
    }

    return new TranslationError(ErrorCode.PROVIDER_ERROR, {
      provider: 'ollama',
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

export function createOllamaProvider(config: ProviderConfig = {}): LLMProvider {
  return new OllamaProvider(config);
}
