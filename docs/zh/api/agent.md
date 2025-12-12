# TranslationAgent

实现 Self-Refine 算法的低级翻译代理。

## 构造函数

```typescript
import { TranslationAgent } from '@llm-translate/cli';

const agent = new TranslationAgent(options: TranslationAgentOptions);
```

### 选项

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

## 方法

### translate

使用 Self-Refine 循环翻译内容。

```typescript
const result = await agent.translate(request: TranslationRequest);
```

#### 请求

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

#### 结果

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

## Self-Refine 算法

该代理实现以下迭代细化过程：

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

## 使用示例

### 基本翻译

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

### 使用术语表

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

### 使用上下文

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

### 严格质量模式

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

## 质量评估

该代理根据四个标准评估翻译：

| 标准 | 权重 | 描述 |
|-----------|--------|-------------|
| 语义准确性 | 40% | 意义保留 |
| 流畅性 | 25% | 自然语言流畅度 |
| 术语表合规性 | 20% | 术语一致性 |
| 格式保留 | 15% | 结构维护 |

### 评估结果

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

## 提示缓存

当 `enableCaching` 为 true 时（Claude 默认值），该代理会结构化提示以进行缓存：

```
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │  ← Reused across chunks
├─────────────────────────────────┤
│ Glossary (CACHED)              │  ← Reused across chunks
├─────────────────────────────────┤
│ Source Text (NOT cached)       │  ← Changes per chunk
└─────────────────────────────────┘
```

这可以将多分块文档的成本降低 40-50%。

## 高级：自定义评估

覆盖默认评估逻辑：

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
