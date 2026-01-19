import * as cheerio from 'cheerio';
import type { CheerioAPI, Cheerio, Element, AnyNode, Text } from 'cheerio';
import { estimateTokens } from '../utils/tokens.js';

// ============================================================================
// Types
// ============================================================================

export interface ParsedHTMLDocument {
  /** Original HTML content */
  original: string;
  /** Cheerio instance for manipulation */
  $: CheerioAPI;
  /** Extracted translatable sections */
  sections: HTMLSection[];
  /** Whether the document has <html> or <body> tags */
  isFullDocument: boolean;
}

export interface HTMLSection {
  /** Unique identifier */
  id: string;
  /** Text content to translate */
  content: string;
  /** HTML path for restoration (e.g., "body > div:nth-child(1) > p:nth-child(2)") */
  selector: string;
  /** Element tag name */
  tagName: string;
  /** Whether this is an attribute (alt, title) rather than text content */
  isAttribute?: boolean;
  /** Attribute name if isAttribute is true */
  attributeName?: string;
  /** Estimated token count */
  tokenCount: number;
  /** Whether this section should be translated */
  translatable: boolean;
}

export interface HTMLChunk {
  /** Chunk ID */
  id: string;
  /** Combined content for translation (with placeholders) */
  content: string;
  /** Sections included in this chunk */
  sections: HTMLSection[];
  /** Estimated token count */
  tokenCount: number;
}

export interface HTMLTranslationMap {
  [sectionId: string]: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Tags that should never be translated */
const SKIP_TAGS = new Set([
  'script',
  'style',
  'code',
  'pre',
  'kbd',
  'samp',
  'var',
  'noscript',
  'template',
  'svg',
  'math',
]);

/** Inline tags that should be kept with surrounding text */
const INLINE_TAGS = new Set([
  'a',
  'abbr',
  'acronym',
  'b',
  'bdo',
  'big',
  'br',
  'cite',
  'dfn',
  'em',
  'i',
  'img',
  'input',
  'label',
  'map',
  'object',
  'output',
  'q',
  'ruby',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'tt',
  'u',
  'wbr',
]);

/** Block-level tags that are good chunking boundaries */
const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'dialog',
  'dd',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

/** Attributes that may contain translatable text */
const TRANSLATABLE_ATTRIBUTES = ['alt', 'title', 'placeholder', 'aria-label'];

// ============================================================================
// Parser Implementation
// ============================================================================

/**
 * Parse HTML content and extract translatable sections
 */
export function parseHTML(content: string): ParsedHTMLDocument {
  const $ = cheerio.load(content, {
    decodeEntities: false,
    xmlMode: false,
  });

  // Determine if this is a full document or fragment
  const isFullDocument = content.includes('<html') || content.includes('<body');

  // Extract translatable sections
  const sections = extractTranslatableSections($, isFullDocument);

  return {
    original: content,
    $,
    sections,
    isFullDocument,
  };
}

/**
 * Extract all translatable text sections from HTML
 */
function extractTranslatableSections(
  $: CheerioAPI,
  isFullDocument: boolean
): HTMLSection[] {
  const sections: HTMLSection[] = [];
  let sectionId = 0;

  // Determine root element
  const root = isFullDocument ? $('body') : $.root();

  // Walk through all elements
  function processElement(element: Cheerio<AnyNode>, parentSelector: string): void {
    // Track text node index separately (only count text nodes)
    let textNodeIndex = 0;

    element.contents().each((_index, node) => {
      if (node.type === 'text') {
        const textNode = node as Text;
        const text = textNode.data;

        // Always increment text node index for text nodes
        const currentTextIndex = textNodeIndex++;

        // Skip empty or whitespace-only text
        if (!text || !text.trim()) return;

        // Get parent element info
        const parent = $(node).parent();
        const tagName = (parent[0] as Element)?.tagName?.toLowerCase() || 'unknown';

        // Skip if parent is a non-translatable tag
        if (SKIP_TAGS.has(tagName)) return;

        // Build selector for this text node
        const selector = buildSelector($, parent, parentSelector, currentTextIndex);

        sections.push({
          id: `section-${sectionId++}`,
          content: text,
          selector,
          tagName,
          tokenCount: estimateTokens(text),
          translatable: true,
        });
      } else if (node.type === 'tag') {
        const elem = node as Element;
        const tagName = elem.tagName?.toLowerCase();

        // Skip non-translatable tags entirely
        if (SKIP_TAGS.has(tagName)) return;

        const $elem = $(elem);
        const selector = buildSelector($, $elem, parentSelector);

        // Extract translatable attributes
        for (const attrName of TRANSLATABLE_ATTRIBUTES) {
          const attrValue = $elem.attr(attrName);
          if (attrValue && attrValue.trim()) {
            sections.push({
              id: `section-${sectionId++}`,
              content: attrValue,
              selector,
              tagName,
              isAttribute: true,
              attributeName: attrName,
              tokenCount: estimateTokens(attrValue),
              translatable: true,
            });
          }
        }

        // Recursively process children
        processElement($elem, selector);
      }
    });
  }

  processElement(root, '');

  return sections;
}

/**
 * Build a CSS selector path to an element
 * @param $ - Cheerio instance
 * @param element - The element to build selector for
 * @param parentSelector - The parent's selector (already complete path to parent)
 * @param textIndex - If provided, this is for a text node within the element
 */
function buildSelector(
  $: CheerioAPI,
  element: Cheerio<AnyNode>,
  parentSelector: string,
  textIndex?: number
): string {
  const elem = element[0];
  if (!elem || elem.type !== 'tag') {
    return parentSelector + (textIndex !== undefined ? `::text(${textIndex})` : '');
  }

  const tagElem = elem as Element;
  const tagName = tagElem.tagName?.toLowerCase() || 'unknown';
  const id = $(elem).attr('id');

  // If we have a text index, the parentSelector already points to this element
  // Just append the text index
  if (textIndex !== undefined) {
    if (id) {
      return `#${id}::text(${textIndex})`;
    }
    // parentSelector should already point to this element
    return parentSelector ? `${parentSelector}::text(${textIndex})` : `${tagName}::text(${textIndex})`;
  }

  // Use ID if available (most reliable)
  if (id) {
    return `#${id}`;
  }

  // Otherwise, build path based on position
  const parent = $(elem).parent();
  const siblings = parent.children(tagName);
  const index = siblings.index(elem);

  let selector = tagName;
  if (siblings.length > 1) {
    selector += `:nth-of-type(${index + 1})`;
  }

  if (parentSelector) {
    selector = `${parentSelector} > ${selector}`;
  }

  return selector;
}

// ============================================================================
// Chunking for Large HTML Documents
// ============================================================================

export interface HTMLChunkingOptions {
  /** Maximum tokens per chunk */
  maxTokens?: number;
  /** Minimum tokens to create a separate chunk */
  minTokensForChunk?: number;
}

const DEFAULT_HTML_CHUNKING: HTMLChunkingOptions = {
  maxTokens: 2048,
  minTokensForChunk: 100,
};

/**
 * Group HTML sections into chunks for efficient translation
 * Each chunk contains multiple sections that will be translated together
 */
export function chunkHTMLSections(
  sections: HTMLSection[],
  options: HTMLChunkingOptions = {}
): HTMLChunk[] {
  const config = { ...DEFAULT_HTML_CHUNKING, ...options };
  const chunks: HTMLChunk[] = [];

  // Filter only translatable sections
  const translatableSections = sections.filter((s) => s.translatable);

  if (translatableSections.length === 0) {
    return [];
  }

  let currentChunk: HTMLSection[] = [];
  let currentTokens = 0;
  let chunkId = 0;

  for (const section of translatableSections) {
    const sectionTokens = section.tokenCount;

    // If adding this section would exceed max, save current chunk
    if (currentTokens + sectionTokens > config.maxTokens! && currentChunk.length > 0) {
      chunks.push(createChunk(currentChunk, chunkId++));
      currentChunk = [];
      currentTokens = 0;
    }

    currentChunk.push(section);
    currentTokens += sectionTokens;
  }

  // Add remaining sections
  if (currentChunk.length > 0) {
    chunks.push(createChunk(currentChunk, chunkId));
  }

  return chunks;
}

/**
 * Create a chunk from a group of sections
 */
function createChunk(sections: HTMLSection[], id: number): HTMLChunk {
  // Format sections with placeholders for translation
  const lines: string[] = [];

  for (const section of sections) {
    if (section.isAttribute) {
      lines.push(`[${section.id}:${section.attributeName}] ${section.content}`);
    } else {
      lines.push(`[${section.id}] ${section.content}`);
    }
  }

  const content = lines.join('\n\n');

  return {
    id: `chunk-${id}`,
    content,
    sections,
    tokenCount: estimateTokens(content),
  };
}

// ============================================================================
// Translation Application
// ============================================================================

/**
 * Parse translated chunk content back into section translations
 */
export function parseTranslatedChunk(
  chunk: HTMLChunk,
  translatedContent: string
): HTMLTranslationMap {
  const map: HTMLTranslationMap = {};

  // Split by section markers
  const regex = /\[([^\]]+)\]\s*([^[]*?)(?=\n\n\[|\n*$)/gs;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(translatedContent)) !== null) {
    const marker = match[1];
    let translation = match[2]?.trim() || '';

    // Extract section ID from marker (e.g., "section-0:alt" or "section-0")
    const idMatch = marker?.match(/^(section-\d+)/);
    if (idMatch) {
      map[idMatch[1]!] = translation;
    }
  }

  // Fallback: if regex didn't match well, try line-by-line matching
  if (Object.keys(map).length === 0 && chunk.sections.length === 1) {
    // Single section - use entire content
    map[chunk.sections[0]!.id] = translatedContent.trim();
  }

  return map;
}

/**
 * Apply translations to the parsed HTML document
 */
export function applyHTMLTranslations(
  document: ParsedHTMLDocument,
  translations: HTMLTranslationMap
): string {
  const $ = document.$;

  for (const section of document.sections) {
    const translation = translations[section.id];
    if (!translation) continue;

    try {
      if (section.isAttribute && section.attributeName) {
        // Update attribute value
        const elem = $(section.selector.replace(/::text\(\d+\)$/, ''));
        elem.attr(section.attributeName, translation);
      } else {
        // Update text content
        // Handle the ::text(index) pseudo-selector
        const textMatch = section.selector.match(/^(.*)::text\((\d+)\)$/);

        if (textMatch) {
          const [, parentSelector, textIndexStr] = textMatch;
          const textIndex = parseInt(textIndexStr!, 10);
          const parent = $(parentSelector!);

          // Find and update the specific text node
          let currentTextIndex = 0;
          parent.contents().each((_i, node) => {
            if (node.type === 'text') {
              if (currentTextIndex === textIndex) {
                (node as Text).data = translation;
                return false; // break
              }
              currentTextIndex++;
            }
          });
        } else {
          // No text index - this shouldn't happen for text sections
          // but handle gracefully by updating first text node
          const elem = $(section.selector);
          const contents = elem.contents();
          let updated = false;

          contents.each((_i, node) => {
            if (node.type === 'text' && !updated) {
              (node as Text).data = translation;
              updated = true;
            }
          });
        }
      }
    } catch (error) {
      // Log but continue - don't fail entire document for one section
      console.warn(`Failed to apply translation for ${section.id}:`, error);
    }
  }

  // Return the modified HTML
  if (document.isFullDocument) {
    return $.html();
  } else {
    // For fragments, return only the body content
    return $('body').html() || $.html();
  }
}

// ============================================================================
// High-Level Translation Function
// ============================================================================

/**
 * Translate HTML content using a translation function
 * This is the main entry point for HTML translation
 */
export async function translateHTMLContent(
  content: string,
  translateFn: (text: string) => Promise<string>,
  options: HTMLChunkingOptions = {}
): Promise<string> {
  // Parse the HTML
  const document = parseHTML(content);

  // If no translatable sections, return original
  if (document.sections.length === 0) {
    return content;
  }

  // Chunk the sections
  const chunks = chunkHTMLSections(document.sections, options);

  // Translate each chunk
  const allTranslations: HTMLTranslationMap = {};

  for (const chunk of chunks) {
    try {
      const translatedChunk = await translateFn(chunk.content);
      const chunkTranslations = parseTranslatedChunk(chunk, translatedChunk);

      // Merge translations
      Object.assign(allTranslations, chunkTranslations);
    } catch (error) {
      console.warn(`Failed to translate chunk ${chunk.id}:`, error);
      // Keep original content for failed chunks
      for (const section of chunk.sections) {
        allTranslations[section.id] = section.content;
      }
    }
  }

  // Apply all translations
  return applyHTMLTranslations(document, allTranslations);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a tag is a block-level element
 */
export function isBlockTag(tagName: string): boolean {
  return BLOCK_TAGS.has(tagName.toLowerCase());
}

/**
 * Check if a tag should be skipped (not translated)
 */
export function isSkipTag(tagName: string): boolean {
  return SKIP_TAGS.has(tagName.toLowerCase());
}

/**
 * Get statistics about parsed HTML document
 */
export function getHTMLStats(document: ParsedHTMLDocument): {
  totalSections: number;
  translatableSections: number;
  attributeSections: number;
  totalTokens: number;
  avgTokensPerSection: number;
} {
  const translatableSections = document.sections.filter((s) => s.translatable);
  const attributeSections = document.sections.filter((s) => s.isAttribute);
  const totalTokens = document.sections.reduce((sum, s) => sum + s.tokenCount, 0);

  return {
    totalSections: document.sections.length,
    translatableSections: translatableSections.length,
    attributeSections: attributeSections.length,
    totalTokens,
    avgTokensPerSection:
      document.sections.length > 0
        ? Math.round(totalTokens / document.sections.length)
        : 0,
  };
}
