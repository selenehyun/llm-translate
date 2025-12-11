import type { ProviderName } from '../types/index.js';

// ============================================================================
// Chat Message Types
// ============================================================================

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  finishReason: 'stop' | 'length' | 'error';
}

// ============================================================================
// Model Information
// ============================================================================

export interface ModelInfo {
  maxContextTokens: number;
  supportsStreaming: boolean;
  costPer1kInput?: number;
  costPer1kOutput?: number;
}

// ============================================================================
// Provider Configuration
// ============================================================================

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

// ============================================================================
// LLM Provider Interface
// ============================================================================

export interface LLMProvider {
  readonly name: ProviderName;

  /**
   * The default model used by this provider
   */
  readonly defaultModel: string;

  /**
   * Send a chat request and receive a complete response
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Send a chat request and receive a streaming response
   */
  stream(request: ChatRequest): AsyncIterable<string>;

  /**
   * Count the number of tokens in a text string
   */
  countTokens(text: string): number;

  /**
   * Get information about a specific model
   */
  getModelInfo(model?: string): ModelInfo;
}

// ============================================================================
// Provider Factory Type
// ============================================================================

export type ProviderFactory = (config: ProviderConfig) => LLMProvider;
