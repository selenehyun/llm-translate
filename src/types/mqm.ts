/**
 * MQM (Multidimensional Quality Metrics) Types
 * Based on https://themqm.org/ framework used in WMT evaluations
 *
 * Reference: TEaR (Translate, Estimate, Refine) - NAACL 2025
 * https://arxiv.org/abs/2402.16379
 */

/**
 * MQM Error Categories
 */
export type MQMErrorType =
  // Accuracy errors - meaning/content issues
  | 'accuracy/mistranslation' // Incorrect meaning
  | 'accuracy/omission' // Missing content from source
  | 'accuracy/addition' // Extra content not in source
  | 'accuracy/untranslated' // Source text left unchanged
  // Fluency errors - target language issues
  | 'fluency/grammar' // Grammatical errors
  | 'fluency/spelling' // Spelling/typos
  | 'fluency/register' // Inappropriate formality level
  | 'fluency/inconsistency' // Inconsistent terminology
  // Style errors - quality/naturalness issues
  | 'style/awkward' // Unnatural phrasing
  | 'style/unidiomatic'; // Non-native expressions

/**
 * MQM Severity Levels
 */
export type MQMSeverity = 'minor' | 'major' | 'critical';

/**
 * MQM Severity Weights for score calculation
 */
export const MQM_SEVERITY_WEIGHTS: Record<MQMSeverity, number> = {
  minor: 1, // Noticeable but doesn't affect understanding
  major: 5, // Affects understanding or usability
  critical: 25, // Completely wrong or unusable
};

/**
 * Individual MQM error annotation
 */
export interface MQMError {
  /** Error category */
  type: MQMErrorType;

  /** Error severity */
  severity: MQMSeverity;

  /** The affected text in translation */
  span: string;

  /** Suggested correction */
  suggestion: string;

  /** Brief reason for the error */
  explanation?: string;

  /** Corresponding source text (if applicable) */
  sourceSpan?: string;
}

/**
 * MQM evaluation result
 */
export interface MQMEvaluation {
  /** List of identified errors */
  errors: MQMError[];

  /** Quality score: 100 - sum(error weights), min 0 */
  score: number;

  /** Brief overall assessment */
  summary: string;

  /** Error count breakdown by category */
  breakdown: {
    accuracy: number;
    fluency: number;
    style: number;
  };
}

/**
 * Calculate MQM score from errors
 * Score = max(0, 100 - Σ(error_weight))
 */
export function calculateMQMScore(errors: MQMError[]): number {
  const totalPenalty = errors.reduce(
    (sum, err) => sum + MQM_SEVERITY_WEIGHTS[err.severity],
    0
  );
  return Math.max(0, 100 - totalPenalty);
}

/**
 * Calculate error breakdown by category
 */
export function calculateMQMBreakdown(
  errors: MQMError[]
): MQMEvaluation['breakdown'] {
  return {
    accuracy: errors.filter((e) => e.type.startsWith('accuracy/')).length,
    fluency: errors.filter((e) => e.type.startsWith('fluency/')).length,
    style: errors.filter((e) => e.type.startsWith('style/')).length,
  };
}

/**
 * Parse MQM evaluation JSON response from LLM
 */
export function parseMQMResponse(response: string): MQMEvaluation | null {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      errors?: MQMError[];
      score?: number;
      summary?: string;
    };

    const errors = parsed.errors ?? [];
    const score = parsed.score ?? calculateMQMScore(errors);

    return {
      errors,
      score,
      summary: parsed.summary ?? '',
      breakdown: calculateMQMBreakdown(errors),
    };
  } catch {
    return null;
  }
}

/**
 * Format MQM errors for refinement prompt
 */
export function formatMQMErrorsForPrompt(errors: MQMError[]): string {
  if (errors.length === 0) {
    return 'No errors identified.';
  }

  return errors
    .map((err, i) => {
      const severity = err.severity.toUpperCase();
      return `${i + 1}. [${severity}] ${err.type}
   Text: "${err.span}"
   Fix: "${err.suggestion}"${err.explanation ? `\n   Reason: ${err.explanation}` : ''}`;
    })
    .join('\n\n');
}
