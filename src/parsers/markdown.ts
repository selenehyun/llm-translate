import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import type { Root, RootContent, Text, Code, InlineCode } from 'mdast';
import { visit } from 'unist-util-visit';

// ============================================================================
// Types
// ============================================================================

export interface ParsedDocument {
  /** Original markdown content */
  original: string;
  /** AST representation */
  ast: Root;
  /** Extracted text nodes for translation */
  textNodes: TextNode[];
}

export interface TextNode {
  /** Unique identifier for this node */
  id: string;
  /** Text content to translate */
  content: string;
  /** Node type in AST */
  type: string;
  /** Position in source document */
  position?: {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
  };
  /** Path to node in AST (for restoration) */
  path: number[];
  /** Whether this node should be translated */
  translatable: boolean;
}

export interface TranslationMap {
  [nodeId: string]: string;
}

// ============================================================================
// Parser Implementation
// ============================================================================

/**
 * Parse markdown content and extract translatable text nodes
 */
export async function parseMarkdown(content: string): Promise<ParsedDocument> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const ast = processor.parse(content) as Root;
  const textNodes = extractTextNodes(ast);

  return {
    original: content,
    ast,
    textNodes,
  };
}

/**
 * Apply translations to AST and stringify back to markdown
 */
export async function applyTranslations(
  document: ParsedDocument,
  translations: TranslationMap
): Promise<string> {
  // Clone the AST to avoid mutating original
  const ast = structuredClone(document.ast);

  // Apply translations to each text node
  for (const textNode of document.textNodes) {
    if (!textNode.translatable) continue;

    const translation = translations[textNode.id];
    if (!translation) continue;

    // Navigate to the node in AST and update its value
    const node = getNodeAtPath(ast, textNode.path);
    if (node && 'value' in node) {
      (node as Text).value = translation;
    }
  }

  // Stringify back to markdown
  const processor = unified()
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      emphasis: '*',
      strong: '*',
      fence: '`',
      fences: true,
      listItemIndent: 'one',
    });

  const result = processor.stringify(ast);
  return String(result);
}

// ============================================================================
// Text Node Extraction
// ============================================================================

function extractTextNodes(ast: Root): TextNode[] {
  const textNodes: TextNode[] = [];
  let nodeId = 0;

  visit(ast, (node, index, parent) => {
    // Skip code blocks - they should not be translated
    if (node.type === 'code' || node.type === 'inlineCode') {
      textNodes.push({
        id: `node-${nodeId++}`,
        content: (node as Code | InlineCode).value,
        type: node.type,
        position: node.position,
        path: getNodePath(ast, node, index, parent),
        translatable: false,
      });
      return;
    }

    // Extract text nodes
    if (node.type === 'text') {
      const textContent = (node as Text).value;

      // Skip empty or whitespace-only text
      if (!textContent.trim()) return;

      textNodes.push({
        id: `node-${nodeId++}`,
        content: textContent,
        type: node.type,
        position: node.position,
        path: getNodePath(ast, node, index, parent),
        translatable: true,
      });
    }
  });

  return textNodes;
}

// ============================================================================
// AST Navigation Helpers
// ============================================================================

function getNodePath(
  _root: Root,
  _node: unknown,
  index: number | undefined,
  parent: unknown
): number[] {
  const path: number[] = [];

  // Build path by traversing up to root
  let currentParent = parent as { children?: unknown[] } | null;
  let currentIndex = index;

  while (currentParent && currentIndex !== undefined) {
    path.unshift(currentIndex);
    // Note: This is a simplified path - for full implementation,
    // we'd need to track parent references during traversal
    break;
  }

  if (index !== undefined) {
    path.push(index);
  }

  return path;
}

function getNodeAtPath(ast: Root, path: number[]): RootContent | null {
  let current: Root | RootContent = ast;

  for (const index of path) {
    if ('children' in current && Array.isArray(current.children)) {
      const child: RootContent | undefined = current.children[index];
      if (!child) return null;
      current = child;
    } else {
      return null;
    }
  }

  return current as RootContent;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get only translatable text from a parsed document
 */
export function getTranslatableText(document: ParsedDocument): string[] {
  return document.textNodes
    .filter((node) => node.translatable)
    .map((node) => node.content);
}

/**
 * Create a translation map from an array of translations
 * (in same order as getTranslatableText output)
 */
export function createTranslationMap(
  document: ParsedDocument,
  translations: string[]
): TranslationMap {
  const translatableNodes = document.textNodes.filter((node) => node.translatable);
  const map: TranslationMap = {};

  for (let i = 0; i < translatableNodes.length && i < translations.length; i++) {
    const node = translatableNodes[i];
    if (node) {
      map[node.id] = translations[i] ?? node.content;
    }
  }

  return map;
}

/**
 * Extract full text content for translation (preserving structure markers)
 *
 * Processing order is important:
 * 1. First, handle fenced code blocks (must be at line start with newline after opener)
 * 2. Then, handle multi-backtick inline code (for examples like ` ```js...``` `)
 * 3. Then, handle single-backtick inline code
 * 4. Finally, handle link URLs
 */
export function extractTextForTranslation(content: string): {
  text: string;
  preservedSections: Map<string, string>;
} {
  const preservedSections = new Map<string, string>();
  let placeholderIndex = 0;

  // Step 1: Replace fenced code blocks FIRST (must start at beginning of line with newline)
  // This ensures proper code blocks are captured before multi-backtick inline code
  let text = content.replace(/^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*$/gm, (match) => {
    const placeholder = `__CODE_BLOCK_${placeholderIndex++}__`;
    preservedSections.set(placeholder, match);
    return placeholder;
  });

  // Step 2: Replace multi-backtick inline code (2+ backticks on same line)
  // This catches examples like `` `variable` `` or ` ```js...``` ` in tables
  // Only matches within a single line to avoid matching across paragraphs
  text = text.replace(/(`{2,})(?:[^`\n]|`(?!\1))*?\1/g, (match) => {
    const placeholder = `__INLINE_CODE_${placeholderIndex++}__`;
    preservedSections.set(placeholder, match);
    return placeholder;
  });

  // Step 3: Replace remaining single-backtick inline code
  text = text.replace(/`[^`\n]+`/g, (match) => {
    const placeholder = `__INLINE_CODE_${placeholderIndex++}__`;
    preservedSections.set(placeholder, match);
    return placeholder;
  });

  // Step 4: Replace URLs in links with placeholders
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
    const placeholder = `__LINK_URL_${placeholderIndex++}__`;
    preservedSections.set(placeholder, url as string);
    return `[${linkText}](${placeholder})`;
  });

  return { text, preservedSections };
}

/**
 * Restore preserved sections after translation
 *
 * Uses flexible regex matching to handle cases where LLM may have:
 * - Added spaces around placeholders
 * - Changed case
 * - Added extra underscores
 */
export function restorePreservedSections(
  translatedText: string,
  preservedSections: Map<string, string>
): string {
  let result = translatedText;

  // Sort by key length descending to handle CODE_BLOCK_12 before CODE_BLOCK_1
  const sortedEntries = [...preservedSections.entries()].sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [placeholder, original] of sortedEntries) {
    // Extract the core identifier (e.g., "CODE_BLOCK_12" from "__CODE_BLOCK_12__")
    const match = placeholder.match(/^__(.+)__$/);
    if (match && match[1]) {
      const identifier = match[1];
      // Escape any regex special characters in identifier
      const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Create flexible regex that handles:
      // - Optional surrounding spaces (but NOT newlines - use [ \t]* instead of \s*)
      // - Extra underscores
      // - Case insensitivity
      // - (?!\d) ensures CODE_BLOCK_1 doesn't match part of CODE_BLOCK_12
      const flexiblePattern = new RegExp(
        `[ \\t]*_*_*[ \\t]*${escapedId}(?!\\d)[ \\t]*_*_*[ \\t]*`,
        'gi'
      );
      // Use function replacement to avoid special character interpretation ($&, $', etc.)
      result = result.replace(flexiblePattern, () => original);
    } else {
      // Fallback to exact replacement - also use function to avoid special chars
      result = result.split(placeholder).join(original);
    }
  }

  // Post-process: Ensure proper spacing around inline code
  // This fixes cases where LLM removed spaces around placeholders during translation
  result = ensureInlineCodeSpacing(result);

  return result;
}

/**
 * Ensure proper spacing around inline code backticks.
 * LLMs often remove spaces around placeholders, causing markdown formatting issues.
 *
 * Rules:
 * - Add space before ` if preceded by word char (letter/number/CJK)
 * - Add space before ` if preceded by number+period (markdown list like "1.")
 * - Add space after ` if followed by word char/CJK
 * - Don't add spaces at line start/end
 */
function ensureInlineCodeSpacing(text: string): string {
  // Match inline code: backtick(s) + content + same backticks
  // We need to add spaces where they're missing around inline code

  // CJK Unicode ranges: \u3000-\u9fff\uac00-\ud7af (Chinese, Japanese, Korean)

  // Add space before inline code if preceded by:
  // - word/CJK character
  // - number followed by period (markdown numbered list: "1.")
  let result = text.replace(
    /([\w\u3000-\u9fff\uac00-\ud7af])(`+[^`\n]+`+)/g,
    '$1 $2'
  );

  // Handle markdown numbered list case: "1.`code`" → "1. `code`"
  result = result.replace(
    /(\d+\.)(`+[^`\n]+`+)/g,
    '$1 $2'
  );

  // Add space after inline code if followed by word/CJK character
  result = result.replace(
    /(`+[^`\n]+`+)([\w\u3000-\u9fff\uac00-\ud7af])/g,
    '$1 $2'
  );

  return result;
}

/**
 * Simple markdown translation that preserves structure
 * This is the main function to use for translating markdown content
 */
export async function translateMarkdownContent(
  content: string,
  translateFn: (text: string) => Promise<string>
): Promise<string> {
  // Extract text for translation with preserved sections
  const { text, preservedSections } = extractTextForTranslation(content);

  // Translate the text
  const translatedText = await translateFn(text);

  // Restore preserved sections
  return restorePreservedSections(translatedText, preservedSections);
}
