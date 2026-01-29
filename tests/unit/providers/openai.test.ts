import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider, createOpenAIProvider } from '../../../src/providers/openai.js';
import { TranslationError, ErrorCode } from '../../../src/errors.js';

// ============================================================================
// Mock Setup
// ============================================================================

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// ============================================================================
// Tests
// ============================================================================

describe('OpenAIProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with API key from env', () => {
      const provider = new OpenAIProvider();

      expect(provider.name).toBe('openai');
      expect(provider.defaultModel).toBe('gpt-4o-mini');
      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: undefined,
      });
    });

    it('should create provider with explicit API key', () => {
      const provider = new OpenAIProvider({ apiKey: 'explicit-key' });

      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'explicit-key',
        baseURL: undefined,
      });
    });

    it('should use custom base URL', () => {
      const provider = new OpenAIProvider({
        apiKey: 'key',
        baseUrl: 'https://custom.openai.com',
      });

      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'key',
        baseURL: 'https://custom.openai.com',
      });
    });

    it('should use custom default model', () => {
      const provider = new OpenAIProvider({
        apiKey: 'key',
        defaultModel: 'gpt-4o',
      });

      expect(provider.defaultModel).toBe('gpt-4o');
    });

    it('should throw error when API key is missing', () => {
      delete process.env['OPENAI_API_KEY'];

      expect(() => new OpenAIProvider()).toThrow(TranslationError);
      expect(() => new OpenAIProvider()).toThrow(/API key/i);
    });
  });

  describe('chat', () => {
    it('should call generateText with correct parameters', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Translated text',
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new OpenAIProvider({ apiKey: 'key' });
      const result = await provider.chat({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.content).toBe('Translated text');
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
      expect(result.finishReason).toBe('stop');
    });

    it('should flatten array content to string', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Response',
        usage: { promptTokens: 10, completionTokens: 10 },
        finishReason: 'stop',
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new OpenAIProvider({ apiKey: 'key' });
      await provider.chat({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Part 1' },
            { type: 'text', text: 'Part 2' },
          ],
        }],
      });

      expect(generateText).toHaveBeenCalled();
      const call = vi.mocked(generateText).mock.calls[0]?.[0];
      expect(call?.messages?.[0]?.content).toBe('Part 1Part 2');
    });

    it('should handle rate limit errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('Rate limit exceeded'));

      const provider = new OpenAIProvider({ apiKey: 'key' });

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should handle auth errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('Incorrect API key'));

      const provider = new OpenAIProvider({ apiKey: 'key' });

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should handle quota exceeded errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('insufficient_quota'));

      const provider = new OpenAIProvider({ apiKey: 'key' });

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should handle context length errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('context_length_exceeded'));

      const provider = new OpenAIProvider({ apiKey: 'key' });

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });
  });

  describe('stream', () => {
    it('should yield text chunks', async () => {
      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Hello ';
          yield 'World';
        },
      };

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream,
      } as unknown as ReturnType<typeof streamText>);

      const provider = new OpenAIProvider({ apiKey: 'key' });
      const chunks: string[] = [];

      for await (const chunk of provider.stream({
        messages: [{ role: 'user', content: 'Test' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello ', 'World']);
    });

    it('should fallback to chat for non-streaming models', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Non-streaming response',
        usage: { promptTokens: 10, completionTokens: 10 },
        finishReason: 'stop',
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new OpenAIProvider({ apiKey: 'key' });
      const chunks: string[] = [];

      for await (const chunk of provider.stream({
        messages: [{ role: 'user', content: 'Test' }],
        model: 'o1', // o1 models don't support streaming
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Non-streaming response']);
    });
  });

  describe('countTokens', () => {
    it('should return estimated token count', () => {
      const provider = new OpenAIProvider({ apiKey: 'key' });
      const count = provider.countTokens('This is a test sentence.');

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });
  });

  describe('getModelInfo', () => {
    it('should return model info for gpt-4o', () => {
      const provider = new OpenAIProvider({ apiKey: 'key' });
      const info = provider.getModelInfo('gpt-4o');

      expect(info.maxContextTokens).toBe(128000);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return model info for gpt-4o-mini', () => {
      const provider = new OpenAIProvider({ apiKey: 'key' });
      const info = provider.getModelInfo('gpt-4o-mini');

      expect(info.maxContextTokens).toBe(128000);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return info for o1 models without streaming', () => {
      const provider = new OpenAIProvider({ apiKey: 'key' });
      const info = provider.getModelInfo('o1');

      expect(info.supportsStreaming).toBe(false);
    });

    it('should return default info for unknown model', () => {
      const provider = new OpenAIProvider({ apiKey: 'key' });
      const info = provider.getModelInfo('unknown-model');

      expect(info.maxContextTokens).toBe(128000);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return info for default model when no model specified', () => {
      const provider = new OpenAIProvider({ apiKey: 'key' });
      const info = provider.getModelInfo();

      expect(info).toBeDefined();
      expect(info.maxContextTokens).toBeGreaterThan(0);
    });
  });
});

describe('createOpenAIProvider', () => {
  beforeEach(() => {
    process.env['OPENAI_API_KEY'] = 'test-key';
  });

  it('should create provider instance', () => {
    const provider = createOpenAIProvider({ apiKey: 'key' });

    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.name).toBe('openai');
  });
});
