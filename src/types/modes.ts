/**
 * Translation Mode Configurations
 *
 * Defines preset configurations for different translation quality/speed tradeoffs
 */

/**
 * Available translation modes
 */
export type TranslationMode = 'fast' | 'balanced' | 'quality';

/**
 * Configuration for a translation mode
 */
export interface ModeConfig {
  /** Enable pre-translation analysis (MAPS-style) */
  enableAnalysis: boolean;

  /** Use MQM-based evaluation instead of simple scoring */
  useMQMEvaluation: boolean;

  /** Maximum refinement iterations */
  maxIterations: number;

  /** Quality threshold (0 = skip threshold check) */
  qualityThreshold: number;
}

/**
 * Mode preset configurations
 */
export const MODE_PRESETS: Record<TranslationMode, ModeConfig> = {
  /**
   * Fast mode: Single pass, no evaluation
   * Best for: Quick drafts, large batches, local models
   * Speed: ~1x (fastest)
   */
  fast: {
    enableAnalysis: false,
    useMQMEvaluation: false,
    maxIterations: 1,
    qualityThreshold: 0, // Skip threshold check
  },

  /**
   * Balanced mode: TEaR with MQM evaluation
   * Best for: General use, good quality with reasonable speed
   * Speed: ~2-3x
   */
  balanced: {
    enableAnalysis: false,
    useMQMEvaluation: true,
    maxIterations: 2,
    qualityThreshold: 75,
  },

  /**
   * Quality mode: Full MAPS + TEaR pipeline
   * Best for: Production content, critical documents
   * Speed: ~4-5x
   */
  quality: {
    enableAnalysis: true,
    useMQMEvaluation: true,
    maxIterations: 4,
    qualityThreshold: 85,
  },
};

/**
 * Get mode configuration with optional overrides
 */
export function getModeConfig(
  mode: TranslationMode,
  overrides?: Partial<ModeConfig>
): ModeConfig {
  const preset = MODE_PRESETS[mode];

  if (!overrides) {
    return preset;
  }

  return {
    enableAnalysis: overrides.enableAnalysis ?? preset.enableAnalysis,
    useMQMEvaluation: overrides.useMQMEvaluation ?? preset.useMQMEvaluation,
    maxIterations: overrides.maxIterations ?? preset.maxIterations,
    qualityThreshold: overrides.qualityThreshold ?? preset.qualityThreshold,
  };
}

/**
 * Determine effective mode from CLI options
 */
export function resolveMode(options: {
  mode?: TranslationMode;
  quality?: number;
  maxIterations?: number;
  noAnalysis?: boolean;
  noMqm?: boolean;
}): ModeConfig {
  const baseMode = options.mode ?? 'balanced';
  const preset = MODE_PRESETS[baseMode];

  return {
    enableAnalysis:
      options.noAnalysis !== undefined
        ? !options.noAnalysis
        : preset.enableAnalysis,
    useMQMEvaluation:
      options.noMqm !== undefined ? !options.noMqm : preset.useMQMEvaluation,
    maxIterations: options.maxIterations ?? preset.maxIterations,
    qualityThreshold: options.quality ?? preset.qualityThreshold,
  };
}

/**
 * Check if mode allows skipping evaluation
 */
export function shouldSkipEvaluation(config: ModeConfig): boolean {
  return config.maxIterations <= 1 && config.qualityThreshold <= 0;
}
