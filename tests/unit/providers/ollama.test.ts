import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaProvider, createOllamaProvider } from '../../../src/providers/ollama.js';
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

// Mock global fetch for model availability check
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// ============================================================================
// Tests
// ============================================================================

describe('OllamaProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Default mock for model availability check
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [{ name: 'llama3.2:latest' }] }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with default base URL', () => {
      const provider = new OllamaProvider();

      expect(provider.name).toBe('ollama');
      expect(provider.defaultModel).toBe('llama3.2');
      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'ollama',
        baseURL: 'http://localhost:11434/v1',
      });
    });

    it('should use OLLAMA_BASE_URL from env', () => {
      process.env['OLLAMA_BASE_URL'] = 'http://custom:8080';
      const provider = new OllamaProvider();

      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'ollama',
        baseURL: 'http://custom:8080/v1',
      });
    });

    it('should use custom base URL', () => {
      const provider = new OllamaProvider({
        baseUrl: 'http://myserver:11434',
      });

      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'ollama',
        baseURL: 'http://myserver:11434/v1',
      });
    });

    it('should use custom default model', () => {
      const provider = new OllamaProvider({
        defaultModel: 'mistral',
      });

      expect(provider.defaultModel).toBe('mistral');
    });
  });

  describe('chat', () => {
    it('should call generateText after checking model availability', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Translated text',
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new OllamaProvider();
      const result = await provider.chat({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
      expect(result.content).toBe('Translated text');
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
    });

    it('should flatten array content to string', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Response',
        usage: { promptTokens: 10, completionTokens: 10 },
        finishReason: 'stop',
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new OllamaProvider();
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

    it('should throw error when Ollama server is not running', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed'));

      const provider = new OllamaProvider();

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should throw error when model is not available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'other-model' }] }),
      });

      const provider = new OllamaProvider();

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should handle connection refused errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('ECONNREFUSED'));

      // First call for model check succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'llama3.2:latest' }] }),
      });

      const provider = new OllamaProvider();

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should handle context length errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('context too long'));

      const provider = new OllamaProvider();

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should handle out of memory errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('out of memory'));

      const provider = new OllamaProvider();

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

      const provider = new OllamaProvider();
      const chunks: string[] = [];

      for await (const chunk of provider.stream({
        messages: [{ role: 'user', content: 'Test' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello ', 'World']);
    });
  });

  describe('countTokens', () => {
    it('should return estimated token count', () => {
      const provider = new OllamaProvider();
      const count = provider.countTokens('This is a test sentence.');

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });
  });

  describe('getModelInfo', () => {
    it('should return model info for llama3.2', () => {
      const provider = new OllamaProvider();
      const info = provider.getModelInfo('llama3.2');

      expect(info.maxContextTokens).toBe(128000);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return model info for mistral', () => {
      const provider = new OllamaProvider();
      const info = provider.getModelInfo('mistral');

      expect(info.maxContextTokens).toBe(32768);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return model info for qwen2.5', () => {
      const provider = new OllamaProvider();
      const info = provider.getModelInfo('qwen2.5');

      expect(info.maxContextTokens).toBe(128000);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should extract base model from tagged model name', () => {
      const provider = new OllamaProvider();
      const info = provider.getModelInfo('llama3.2:7b');

      expect(info.maxContextTokens).toBe(128000);
    });

    it('should return default info for unknown model', () => {
      const provider = new OllamaProvider();
      const info = provider.getModelInfo('unknown-model');

      expect(info.maxContextTokens).toBe(4096);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return info for default model when no model specified', () => {
      const provider = new OllamaProvider();
      const info = provider.getModelInfo();

      expect(info).toBeDefined();
      expect(info.maxContextTokens).toBeGreaterThan(0);
    });
  });
});

describe('createOllamaProvider', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    });
  });

  it('should create provider instance', () => {
    const provider = createOllamaProvider();

    expect(provider).toBeInstanceOf(OllamaProvider);
    expect(provider.name).toBe('ollama');
  });
});
