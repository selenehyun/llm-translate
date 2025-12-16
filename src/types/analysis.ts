/**
 * Pre-Translation Analysis Types
 * Based on MAPS (Multi-Aspect Prompting and Selection) framework
 *
 * Reference: TACL 2024
 * https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00642/119992
 * https://github.com/zwhe99/MAPS-mt
 */

/**
 * Key term identified during pre-analysis
 */
export interface AnalyzedTerm {
  /** The term in source language */
  term: string;

  /** Usage context */
  context: string;

  /** Suggested translation (if not in glossary) */
  suggestedTranslation?: string;

  /** Whether this term was found in the glossary */
  fromGlossary: boolean;
}

/**
 * Ambiguous phrase that needs clarification
 */
export interface AmbiguousPhrase {
  /** The ambiguous phrase */
  phrase: string;

  /** Possible interpretations */
  interpretations: string[];

  /** Recommended interpretation */
  recommendation: string;
}

/**
 * Domain classification for the content
 */
export type ContentDomain =
  | 'technical'
  | 'marketing'
  | 'legal'
  | 'medical'
  | 'general';

/**
 * Register/formality recommendation
 */
export type RegisterLevel = 'formal' | 'informal' | 'neutral';

/**
 * Pre-translation analysis result (MAPS-style)
 */
export interface PreTranslationAnalysis {
  /** Key domain-specific terms identified */
  keyTerms: AnalyzedTerm[];

  /** Phrases with multiple possible interpretations */
  ambiguousPhrases: AmbiguousPhrase[];

  /** Items that should NOT be translated (code, URLs, names) */
  preserveExact: string[];

  /** Identified translation challenges for this language pair */
  challenges: string[];

  /** Detected content domain */
  domain: ContentDomain;

  /** Recommended formality level */
  registerRecommendation: RegisterLevel;
}

/**
 * Parse pre-analysis JSON response from LLM
 */
export function parseAnalysisResponse(
  response: string
): PreTranslationAnalysis | null {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<PreTranslationAnalysis>;

    return {
      keyTerms: parsed.keyTerms ?? [],
      ambiguousPhrases: parsed.ambiguousPhrases ?? [],
      preserveExact: parsed.preserveExact ?? [],
      challenges: parsed.challenges ?? [],
      domain: parsed.domain ?? 'general',
      registerRecommendation: parsed.registerRecommendation ?? 'neutral',
    };
  } catch {
    return null;
  }
}

/**
 * Format analysis result for translation prompt
 */
export function formatAnalysisForPrompt(
  analysis: PreTranslationAnalysis
): string {
  const sections: string[] = [];

  // Key terms section
  if (analysis.keyTerms.length > 0) {
    const terms = analysis.keyTerms
      .map((t) => {
        const translation = t.suggestedTranslation
          ? ` → ${t.suggestedTranslation}`
          : '';
        const source = t.fromGlossary ? ' (glossary)' : '';
        return `- "${t.term}"${translation}${source}: ${t.context}`;
      })
      .join('\n');
    sections.push(`**Key Terms:**\n${terms}`);
  }

  // Ambiguous phrases section
  if (analysis.ambiguousPhrases.length > 0) {
    const phrases = analysis.ambiguousPhrases
      .map((p) => `- "${p.phrase}": Use interpretation "${p.recommendation}"`)
      .join('\n');
    sections.push(`**Ambiguous Phrases (use these interpretations):**\n${phrases}`);
  }

  // Preserve exact section
  if (analysis.preserveExact.length > 0) {
    sections.push(
      `**Do NOT translate (keep exactly as-is):**\n${analysis.preserveExact.map((s) => `- ${s}`).join('\n')}`
    );
  }

  // Domain and register
  sections.push(
    `**Content Type:** ${analysis.domain}\n**Tone:** ${analysis.registerRecommendation}`
  );

  return sections.join('\n\n');
}

/**
 * Create empty analysis result (for fast mode)
 */
export function createEmptyAnalysis(): PreTranslationAnalysis {
  return {
    keyTerms: [],
    ambiguousPhrases: [],
    preserveExact: [],
    challenges: [],
    domain: 'general',
    registerRecommendation: 'neutral',
  };
}
