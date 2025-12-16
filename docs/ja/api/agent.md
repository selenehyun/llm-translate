# TranslationAgent

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

Self-Refineアルゴリズムを実装した低レベル翻訳エージェントです。

## コンストラクタ

```typescript
import { TranslationAgent } from '@llm-translate/cli';

const agent = new TranslationAgent(options: TranslationAgentOptions);
```

### オプション

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

## メソッド

### translate

Self-Refineループを使用してコンテンツを翻訳します。

```typescript
const result = await agent.translate(request: TranslationRequest);
```

#### リクエスト

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

#### 結果

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

## Self-Refineアルゴリズム

エージェントは以下の反復的改善プロセスを実装しています：

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

## 使用例

### 基本的な翻訳

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

### 用語集を使用した翻訳

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

### コンテキストを使用した翻訳

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

### 厳格品質モード

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

## 品質評価

エージェントは4つの基準で翻訳を評価します：

| 基準 | 重み | 説明 |
|-----------|--------|-------------|
| 意味の正確性 | 40% | 意味の保持 |
| 流暢性 | 25% | 自然な言語の流れ |
| 用語集の遵守 | 20% | 用語の一貫性 |
| 形式の保持 | 15% | 構造の維持 |

### 評価結果

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

## プロンプトキャッシング

`enableCaching` がtrue（Claudeのデフォルト）の場合、エージェントはキャッシング用にプロンプトを構造化します：

```
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │  ← Reused across chunks
├─────────────────────────────────┤
│ Glossary (CACHED)              │  ← Reused across chunks
├─────────────────────────────────┤
│ Source Text (NOT cached)       │  ← Changes per chunk
└─────────────────────────────────┘
```

これにより、マルチチャンクドキュメントのコストを40-50%削減できます。

## 高度な使用法：カスタム評価

デフォルトの評価ロジックをオーバーライドします：

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
