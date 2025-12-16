# TranslationAgent

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

Low-level translation agent implementing the Self-Refine algorithm.

## Constructor

```typescript
import { TranslationAgent } from '@llm-translate/cli';

const agent = new TranslationAgent(options: TranslationAgentOptions);
```

### Options

```typescript
interface TranslationAgentOptions {
  provider: LLMProvider;
  qualityThreshold?: number;  // Default: 85
  maxIterations?: number;     // Default: 4
  verbose?: boolean;          // Default: false
  strictQuality?: boolean;    // Default: false
  enableCaching?: boolean;    // Default: true for Claude
}
```

## Methods

### translate

Translate content using Self-Refine loop.

```typescript
const result = await agent.translate(request: TranslationRequest);
```

#### Request

```typescript
interface TranslationRequest {
  content: string;           // Source text to translate
  sourceLang: string;        // Source language code
  targetLang: string;        // Target language code
  glossary?: ResolvedGlossary;  // Resolved glossary for target language
  context?: {
    documentPurpose?: string;
    previousChunks?: string[];
    documentSummary?: string;
  };
}
```

#### Result

```typescript
interface TranslationResult {
  content: string;           // Translated text
  metadata: {
    qualityScore: number;
    qualityThreshold: number;
    thresholdMet: boolean;
    iterations: number;
    tokensUsed: {
      input: number;
      output: number;
      cacheRead?: number;
      cacheWrite?: number;
    };
    duration: number;
    provider: string;
    model: string;
  };
  glossaryCompliance?: {
    applied: string[];       // Terms successfully applied
    missed: string[];        // Terms not found in translation
  };
}
```

## Self-Refine Algorithm

The agent implements this iterative refinement process:

```typescript
// Pseudocode
async translate(request) {
  // 1. Initial translation with glossary
  let translation = await generateInitialTranslation(request);
  let iterations = 1;

  while (iterations < maxIterations) {
    // 2. Evaluate quality
    const evaluation = await evaluateQuality(translation);

    if (evaluation.score >= qualityThreshold) {
      break;  // Quality met
    }

    // 3. Generate improvement suggestions
    const suggestions = await generateReflection(translation);

    // 4. Apply improvements
    translation = await improveTranslation(translation, suggestions);
    iterations++;
  }

  return { content: translation, metadata: { ... } };
}
```

## Example Usage

### Basic Translation

```typescript
import { TranslationAgent, createClaudeProvider } from '@llm-translate/cli';

const provider = createClaudeProvider();
const agent = new TranslationAgent({
  provider,
  qualityThreshold: 85,
});

const result = await agent.translate({
  content: 'Hello, world!',
  sourceLang: 'en',
  targetLang: 'ko',
});

console.log(result.content);  // 안녕하세요, 세계!
console.log(result.metadata.qualityScore);  // 92
```

### With Glossary

```typescript
import { loadGlossary, resolveGlossary } from '@llm-translate/cli';

const glossary = await loadGlossary('./glossary.json');
const resolved = resolveGlossary(glossary, 'ko');

const result = await agent.translate({
  content: 'The component renders a prop.',
  sourceLang: 'en',
  targetLang: 'ko',
  glossary: resolved,
});

console.log(result.glossaryCompliance);
// { applied: ['component', 'prop'], missed: [] }
```

### With Context

```typescript
const result = await agent.translate({
  content: 'Click the button to continue.',
  sourceLang: 'en',
  targetLang: 'ko',
  context: {
    documentPurpose: 'User interface instructions',
    previousChunks: [
      '이전 단계에서 설정을 완료했습니다.',  // Previous translation
    ],
  },
});
```

### Strict Quality Mode

```typescript
import { TranslationError, ErrorCode } from '@llm-translate/cli';

const agent = new TranslationAgent({
  provider,
  qualityThreshold: 95,
  strictQuality: true,  // Throw if threshold not met
});

try {
  const result = await agent.translate(request);
} catch (error) {
  if (error instanceof TranslationError &&
      error.code === ErrorCode.QUALITY_THRESHOLD_NOT_MET) {
    console.log(`Quality: ${error.details.score}/${error.details.threshold}`);
    console.log(`Issues: ${error.details.issues.join(', ')}`);
  }
}
```

## Quality Evaluation

The agent evaluates translations on four criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Semantic Accuracy | 40% | Meaning preservation |
| Fluency | 25% | Natural language flow |
| Glossary Compliance | 20% | Term consistency |
| Format Preservation | 15% | Structure maintenance |

### Evaluation Result

```typescript
interface QualityEvaluation {
  score: number;           // 0-100
  breakdown: {
    accuracy: number;      // 0-40
    fluency: number;       // 0-25
    glossary: number;      // 0-20
    format: number;        // 0-15
  };
  issues: string[];        // Specific problems identified
}
```

## Prompt Caching

When `enableCaching` is true (default for Claude), the agent structures prompts for caching:

```
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │  ← Reused across chunks
├─────────────────────────────────┤
│ Glossary (CACHED)              │  ← Reused across chunks
├─────────────────────────────────┤
│ Source Text (NOT cached)       │  ← Changes per chunk
└─────────────────────────────────┘
```

This can reduce costs by 40-50% for multi-chunk documents.

## Advanced: Custom Evaluation

Override the default evaluation logic:

```typescript
class CustomAgent extends TranslationAgent {
  protected async evaluateQuality(
    source: string,
    translation: string,
    sourceLang: string,
    targetLang: string
  ): Promise<QualityEvaluation> {
    // Custom evaluation logic
    const baseEval = await super.evaluateQuality(
      source, translation, sourceLang, targetLang
    );

    // Add custom checks
    if (translation.length < source.length * 0.5) {
      baseEval.score -= 10;
      baseEval.issues.push('Translation suspiciously short');
    }

    return baseEval;
  }
}
```
