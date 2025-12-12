# TranslationAgent

Self-Refine 알고리즘을 구현하는 저수준 번역 에이전트입니다.

## 생성자

```typescript
import { TranslationAgent } from '@llm-translate/cli';

const agent = new TranslationAgent(options: TranslationAgentOptions);
```

### 옵션

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

## 메서드

### translate

Self-Refine 루프를 사용하여 콘텐츠를 번역합니다.

```typescript
const result = await agent.translate(request: TranslationRequest);
```

#### 요청

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

#### 결과

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

## Self-Refine 알고리즘

에이전트는 다음과 같은 반복적 개선 프로세스를 구현합니다:

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

## 사용 예시

### 기본 번역

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

### 용어집 포함

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

### 컨텍스트 포함

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

### 엄격한 품질 모드

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

## 품질 평가

에이전트는 네 가지 기준으로 번역을 평가합니다:

| 기준 | 가중치 | 설명 |
|-----------|--------|-------------|
| 의미론적 정확성 | 40% | 의미 보존 |
| 유창성 | 25% | 자연스러운 언어 흐름 |
| 용어집 준수 | 20% | 용어 일관성 |
| 형식 보존 | 15% | 구조 유지 |

### 평가 결과

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

## 프롬프트 캐싱

`enableCaching` 이 true인 경우(Claude의 기본값), 에이전트는 캐싱을 위해 프롬프트를 구조화합니다:

```
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │  ← Reused across chunks
├─────────────────────────────────┤
│ Glossary (CACHED)              │  ← Reused across chunks
├─────────────────────────────────┤
│ Source Text (NOT cached)       │  ← Changes per chunk
└─────────────────────────────────┘
```

이는 다중 청크 문서의 경우 비용을 40-50% 절감할 수 있습니다.

## 고급: 사용자 정의 평가

기본 평가 로직을 재정의합니다:

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
