import { readFile } from 'node:fs/promises';
import type {
  Glossary,
  GlossaryTerm,
  ResolvedGlossary,
  ResolvedGlossaryTerm,
} from '../types/index.js';
import { TranslationError, ErrorCode } from '../errors.js';

// ============================================================================
// Glossary Loading
// ============================================================================

export async function loadGlossary(path: string): Promise<Glossary> {
  let content: string;

  try {
    content = await readFile(path, 'utf-8');
  } catch (error) {
    throw new TranslationError(ErrorCode.GLOSSARY_NOT_FOUND, {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    return JSON.parse(content) as Glossary;
  } catch (error) {
    throw new TranslationError(ErrorCode.GLOSSARY_INVALID, {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================================================
// Glossary Resolution
// ============================================================================

export function resolveGlossary(
  glossary: Glossary,
  targetLang: string
): ResolvedGlossary {
  return {
    metadata: {
      name: glossary.metadata.name,
      sourceLang: glossary.metadata.sourceLang,
      targetLang,
      version: glossary.metadata.version,
      domain: glossary.metadata.domain,
    },
    terms: glossary.terms
      .map((term) => resolveGlossaryTerm(term, targetLang))
      .filter((term): term is ResolvedGlossaryTerm => term !== null),
  };
}

function resolveGlossaryTerm(
  term: GlossaryTerm,
  targetLang: string
): ResolvedGlossaryTerm | null {
  const target = resolveTarget(term, targetLang);

  // Skip if no translation available and not a doNotTranslate term
  if (target === undefined) {
    return null;
  }

  return {
    source: term.source,
    target,
    context: term.context,
    caseSensitive: term.caseSensitive ?? false,
    doNotTranslate: resolveDoNotTranslate(term, targetLang),
  };
}

function resolveTarget(term: GlossaryTerm, targetLang: string): string | undefined {
  if (term.doNotTranslate) {
    return term.source;
  }

  if (term.doNotTranslateFor?.includes(targetLang)) {
    return term.source;
  }

  const translation = term.targets[targetLang];
  if (translation) {
    return translation;
  }

  // No translation available for this language
  return undefined;
}

function resolveDoNotTranslate(term: GlossaryTerm, targetLang: string): boolean {
  return (
    term.doNotTranslate === true ||
    term.doNotTranslateFor?.includes(targetLang) === true
  );
}

// ============================================================================
// Glossary Lookup
// ============================================================================

export interface GlossaryLookup {
  /**
   * Find a term in the glossary
   */
  find(text: string): ResolvedGlossaryTerm | undefined;

  /**
   * Find all matching terms in a text
   */
  findAll(text: string): ResolvedGlossaryTerm[];

  /**
   * Get all terms
   */
  getTerms(): ResolvedGlossaryTerm[];

  /**
   * Format glossary for prompt injection
   */
  formatForPrompt(): string;
}

export function createGlossaryLookup(glossary: ResolvedGlossary): GlossaryLookup {
  // Create a map for fast lookup
  const termMap = new Map<string, ResolvedGlossaryTerm>();
  const caseSensitiveTerms: ResolvedGlossaryTerm[] = [];
  const caseInsensitiveTerms: ResolvedGlossaryTerm[] = [];

  for (const term of glossary.terms) {
    if (term.caseSensitive) {
      termMap.set(term.source, term);
      caseSensitiveTerms.push(term);
    } else {
      termMap.set(term.source.toLowerCase(), term);
      caseInsensitiveTerms.push(term);
    }
  }

  return {
    find(text: string): ResolvedGlossaryTerm | undefined {
      // Try exact match first
      const exact = termMap.get(text);
      if (exact) return exact;

      // Try case-insensitive
      return termMap.get(text.toLowerCase());
    },

    findAll(text: string): ResolvedGlossaryTerm[] {
      const matches: ResolvedGlossaryTerm[] = [];

      // Check case-sensitive terms
      for (const term of caseSensitiveTerms) {
        if (text.includes(term.source)) {
          matches.push(term);
        }
      }

      // Check case-insensitive terms
      const lowerText = text.toLowerCase();
      for (const term of caseInsensitiveTerms) {
        if (lowerText.includes(term.source.toLowerCase())) {
          matches.push(term);
        }
      }

      return matches;
    },

    getTerms(): ResolvedGlossaryTerm[] {
      return glossary.terms;
    },

    formatForPrompt(): string {
      const lines: string[] = [];

      for (const term of glossary.terms) {
        const flags: string[] = [];

        if (term.caseSensitive) {
          flags.push('case-sensitive');
        } else {
          flags.push('case-insensitive');
        }

        if (term.context) {
          flags.push(`context: ${term.context}`);
        }

        const flagStr = flags.length > 0 ? ` (${flags.join(', ')})` : '';

        if (term.doNotTranslate) {
          lines.push(`- "${term.source}" → [DO NOT TRANSLATE, keep as-is]${flagStr}`);
        } else {
          lines.push(`- "${term.source}" → "${term.target}"${flagStr}`);
        }
      }

      return lines.join('\n');
    },
  };
}

// ============================================================================
// Glossary Compliance Check
// ============================================================================

export interface ComplianceResult {
  applied: string[];
  missed: string[];
  score: number;
}

export function checkGlossaryCompliance(
  sourceText: string,
  translatedText: string,
  glossary: ResolvedGlossary
): ComplianceResult {
  const lookup = createGlossaryLookup(glossary);
  const sourceTerms = lookup.findAll(sourceText);

  const applied: string[] = [];
  const missed: string[] = [];

  for (const term of sourceTerms) {
    const targetInTranslation = term.caseSensitive
      ? translatedText.includes(term.target)
      : translatedText.toLowerCase().includes(term.target.toLowerCase());

    if (targetInTranslation) {
      applied.push(term.source);
    } else {
      missed.push(term.source);
    }
  }

  const total = sourceTerms.length;
  const score = total > 0 ? (applied.length / total) * 100 : 100;

  return { applied, missed, score };
}
