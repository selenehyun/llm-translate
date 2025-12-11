// ============================================================================
// Token Counting Utilities
// ============================================================================

/**
 * Approximate token count for a given text.
 * This is a rough estimate - actual token counts may vary by model.
 *
 * Rules of thumb:
 * - English: ~4 characters per token
 * - CJK (Korean, Japanese, Chinese): ~1.5 characters per token
 * - Code: ~3.5 characters per token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Count different character types
  let latinChars = 0;
  let cjkChars = 0;
  let otherChars = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);

    // CJK Unified Ideographs and related ranges
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
      (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
      (code >= 0x3040 && code <= 0x309f) || // Hiragana
      (code >= 0x30a0 && code <= 0x30ff)    // Katakana
    ) {
      cjkChars++;
    } else if (
      (code >= 0x0041 && code <= 0x005a) || // A-Z
      (code >= 0x0061 && code <= 0x007a) || // a-z
      (code >= 0x0030 && code <= 0x0039)    // 0-9
    ) {
      latinChars++;
    } else {
      otherChars++;
    }
  }

  // Calculate tokens based on character types
  const latinTokens = latinChars / 4;
  const cjkTokens = cjkChars / 1.5;
  const otherTokens = otherChars / 3;

  return Math.ceil(latinTokens + cjkTokens + otherTokens);
}

/**
 * Check if text exceeds a token limit
 */
export function exceedsTokenLimit(text: string, limit: number): boolean {
  return estimateTokens(text) > limit;
}

/**
 * Truncate text to approximately fit within a token limit
 */
export function truncateToTokenLimit(text: string, limit: number): string {
  const estimated = estimateTokens(text);

  if (estimated <= limit) {
    return text;
  }

  // Estimate character limit based on average token ratio
  const avgCharsPerToken = text.length / estimated;
  const targetChars = Math.floor(limit * avgCharsPerToken * 0.95); // 5% safety margin

  return text.slice(0, targetChars) + '...';
}

// ============================================================================
// Token Budget Calculator
// ============================================================================

export interface TokenBudget {
  total: number;
  system: number;
  glossary: number;
  context: number;
  content: number;
  reserved: number;
}

export function calculateTokenBudget(
  maxTokens: number,
  glossarySize: number,
  contextSize: number
): TokenBudget {
  // Reserve tokens for system prompt, formatting, etc.
  const reserved = 500;

  // Glossary and context have fixed sizes
  const glossary = glossarySize;
  const context = contextSize;

  // System prompt estimate
  const system = 300;

  // Content gets the remainder
  const content = maxTokens - reserved - glossary - context - system;

  return {
    total: maxTokens,
    system,
    glossary,
    context,
    content: Math.max(content, 100), // Ensure minimum content budget
    reserved,
  };
}
