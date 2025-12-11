import type { Chunk, ChunkingConfig } from "../types/index.js";
import { estimateTokens } from "../utils/tokens.js";

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ChunkingConfig = {
  maxTokens: 1024,
  overlapTokens: 150,
  separators: ["\n\n", "\n", ". ", " "],
  preservePatterns: [
    /```[\s\S]*?```/g, // Code blocks
    /`[^`]+`/g, // Inline code
    /\[.*?\]\(.*?\)/g, // Links
  ],
};

// ============================================================================
// Chunker Implementation
// ============================================================================

export interface ChunkerOptions {
  maxTokens?: number;
  overlapTokens?: number;
  preserveCodeBlocks?: boolean;
}

/**
 * Split content into chunks that respect token limits
 */
export function chunkContent(
  content: string,
  options: ChunkerOptions = {}
): Chunk[] {
  // Handle empty or whitespace-only content
  if (!content.trim()) {
    return [];
  }

  const config: ChunkingConfig = {
    ...DEFAULT_CONFIG,
    maxTokens: options.maxTokens ?? DEFAULT_CONFIG.maxTokens,
    overlapTokens: options.overlapTokens ?? DEFAULT_CONFIG.overlapTokens,
  };

  // Extract header hierarchy from the entire content
  const headerHierarchy = extractHeaderHierarchy(content);

  // First, identify and extract preserved sections (code blocks, etc.)
  const { segments } = extractPreservedSections(content);

  // Chunk the translatable segments
  const chunks: Chunk[] = [];
  let previousChunkContent: string | undefined;

  for (const segment of segments) {
    // Find relevant headers for this segment
    const segmentHeaders = getHeadersForPosition(
      headerHierarchy,
      segment.startOffset
    );

    if (segment.type === "preserve") {
      // Preserved content (code blocks) - don't chunk
      chunks.push({
        id: `chunk-${chunks.length}`,
        content: segment.content,
        type: "preserve",
        startOffset: segment.startOffset,
        endOffset: segment.endOffset,
        metadata: {
          headerHierarchy: segmentHeaders,
        },
      });
    } else {
      // Translatable content - split into chunks
      const textChunks = splitIntoChunks(
        segment.content,
        config,
        segment.startOffset
      );

      for (let idx = 0; idx < textChunks.length; idx++) {
        const chunk = textChunks[idx];
        if (!chunk) continue;

        // Find headers specific to this chunk's position
        const chunkHeaders = getHeadersForPosition(
          headerHierarchy,
          chunk.startOffset
        );

        chunks.push({
          ...chunk,
          id: `chunk-${chunks.length}`,
          metadata: {
            headerHierarchy:
              chunkHeaders.length > 0 ? chunkHeaders : segmentHeaders,
            previousContext: previousChunkContent,
          },
        });

        // Store current chunk content for next iteration (truncate if too long)
        previousChunkContent = truncateForContext(chunk.content, 200);
      }
    }
  }

  return chunks;
}

/**
 * Extract header hierarchy from markdown content
 */
function extractHeaderHierarchy(
  content: string
): Array<{ level: number; text: string; offset: number }> {
  const headers: Array<{ level: number; text: string; offset: number }> = [];
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(content)) !== null) {
    const hashMarks = match[1];
    if (hashMarks) {
      headers.push({
        level: hashMarks.length,
        text: match[0],
        offset: match.index,
      });
    }
  }

  return headers;
}

/**
 * Get relevant headers for a given position in the document
 */
function getHeadersForPosition(
  headers: Array<{ level: number; text: string; offset: number }>,
  position: number
): string[] {
  const relevantHeaders: string[] = [];
  const currentLevels: Map<number, string> = new Map();

  for (const header of headers) {
    if (header.offset > position) break;

    // Clear all lower level headers when we encounter a new header
    for (const [level] of currentLevels) {
      if (level >= header.level) {
        currentLevels.delete(level);
      }
    }
    currentLevels.set(header.level, header.text);
  }

  // Build hierarchy from level 1 to 6
  for (let level = 1; level <= 6; level++) {
    const headerText = currentLevels.get(level);
    if (headerText) {
      relevantHeaders.push(headerText);
    }
  }

  return relevantHeaders;
}

/**
 * Truncate content for context, preserving word boundaries
 */
function truncateForContext(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;

  const truncated = content.slice(-maxChars);
  const firstSpace = truncated.indexOf(" ");
  if (firstSpace > 0 && firstSpace < 50) {
    return "..." + truncated.slice(firstSpace + 1);
  }
  return "..." + truncated;
}

// ============================================================================
// Preserved Section Extraction
// ============================================================================

interface Segment {
  content: string;
  type: "translatable" | "preserve";
  startOffset: number;
  endOffset: number;
  headerHierarchy?: string[];
}

function extractPreservedSections(content: string): { segments: Segment[] } {
  const preservedRanges: Array<{
    start: number;
    end: number;
    content: string;
  }> = [];

  // Find all code blocks (fenced)
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    preservedRanges.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
    });
  }

  // Sort by start position
  preservedRanges.sort((a, b) => a.start - b.start);

  // Build segments
  const segments: Segment[] = [];
  let lastEnd = 0;

  for (const range of preservedRanges) {
    // Add translatable segment before this preserved section
    if (range.start > lastEnd) {
      const translatableContent = content.slice(lastEnd, range.start);
      // Include segment even if it's only whitespace (to preserve line breaks)
      if (translatableContent.length > 0) {
        segments.push({
          content: translatableContent,
          type: translatableContent.trim() ? "translatable" : "preserve",
          startOffset: lastEnd,
          endOffset: range.start,
        });
      }
    }

    // Add preserved segment
    segments.push({
      content: range.content,
      type: "preserve",
      startOffset: range.start,
      endOffset: range.end,
    });

    lastEnd = range.end;
  }

  // Add remaining translatable content
  if (lastEnd < content.length) {
    const remainingContent = content.slice(lastEnd);
    // Include segment even if it's only whitespace (to preserve line breaks)
    if (remainingContent.length > 0) {
      segments.push({
        content: remainingContent,
        type: remainingContent.trim() ? "translatable" : "preserve",
        startOffset: lastEnd,
        endOffset: content.length,
      });
    }
  }

  // If no preserved sections, return whole content as translatable
  if (segments.length === 0) {
    segments.push({
      content,
      type: "translatable",
      startOffset: 0,
      endOffset: content.length,
    });
  }

  return { segments };
}

// ============================================================================
// Text Chunking with Overlap
// ============================================================================

function splitIntoChunks(
  text: string,
  config: ChunkingConfig,
  baseOffset: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const tokenCount = estimateTokens(text);

  // If text fits in one chunk, return it as-is (preserve whitespace)
  if (tokenCount <= config.maxTokens) {
    return [
      {
        id: "",
        content: text,
        type: "translatable",
        startOffset: baseOffset,
        endOffset: baseOffset + text.length,
      },
    ];
  }

  // Split by paragraph boundaries while preserving the separators
  // Use a regex that captures the separator so we can preserve exact whitespace
  const parts = text.split(/(\n\n+)/);

  let currentChunk = "";
  let chunkStartOffset = baseOffset;
  let textOffset = baseOffset;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined) continue;

    const potentialChunk = currentChunk + part;
    const potentialTokens = estimateTokens(potentialChunk);

    if (potentialTokens > config.maxTokens && currentChunk) {
      // Save current chunk - preserve content as-is without trimming
      chunks.push({
        id: "",
        content: currentChunk,
        type: "translatable",
        startOffset: chunkStartOffset,
        endOffset: textOffset,
      });

      // Start new chunk
      currentChunk = part;
      chunkStartOffset = textOffset;
    } else {
      currentChunk = potentialChunk;
    }

    textOffset += part.length;
  }

  // Add remaining content (preserve as-is)
  if (currentChunk.length > 0) {
    chunks.push({
      id: "",
      content: currentChunk,
      type: "translatable",
      startOffset: chunkStartOffset,
      endOffset: baseOffset + text.length,
    });
  }

  return chunks;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Reassemble chunks back into a document
 * Note: Chunks should not have overlapping content - overlap is only used for context metadata
 */
export function reassembleChunks(chunks: Chunk[]): string {
  // Sort chunks by startOffset
  const sorted = [...chunks].sort((a, b) => a.startOffset - b.startOffset);

  // Simply concatenate - no overlap handling needed since content doesn't overlap
  return sorted.map((chunk) => chunk.content).join("");
}

/**
 * Get chunk statistics
 */
export function getChunkStats(chunks: Chunk[]): {
  totalChunks: number;
  translatableChunks: number;
  preservedChunks: number;
  totalTokens: number;
  averageTokens: number;
} {
  const translatableChunks = chunks.filter((c) => c.type === "translatable");
  const preservedChunks = chunks.filter((c) => c.type === "preserve");

  const totalTokens = chunks.reduce(
    (sum, chunk) => sum + estimateTokens(chunk.content),
    0
  );

  return {
    totalChunks: chunks.length,
    translatableChunks: translatableChunks.length,
    preservedChunks: preservedChunks.length,
    totalTokens,
    averageTokens:
      chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
  };
}
