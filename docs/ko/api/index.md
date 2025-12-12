# API 참조

llm-translate는 Node.js 애플리케이션에서 프로그래밍 방식으로 사용할 수 있습니다.

## 설치

```bash
npm install @llm-translate/cli
```

## 빠른 시작

```typescript
import { TranslationEngine, createClaudeProvider } from '@llm-translate/cli';

// Create provider
const provider = createClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create engine
const engine = new TranslationEngine({
  provider,
  qualityThreshold: 85,
});

// Translate
const result = await engine.translateFile({
  input: 'README.md',
  output: 'README.ko.md',
  sourceLang: 'en',
  targetLang: 'ko',
});

console.log(result.metadata);
```

## 핵심 클래스

### [TranslationEngine](./engine)

번역 작업의 주요 진입점입니다.

```typescript
const engine = new TranslationEngine(options);
await engine.translateFile({ input, output, targetLang });
await engine.translateContent(content, options);
```

### [TranslationAgent](./agent)

Self-Refine 루프가 포함된 저수준 번역 에이전트입니다.

```typescript
const agent = new TranslationAgent({ provider, qualityThreshold });
const result = await agent.translate(request);
```

### [Providers](./providers)

LLM 제공자 구현입니다.

```typescript
import {
  createClaudeProvider,
  createOpenAIProvider,
  createOllamaProvider,
} from '@llm-translate/cli';
```

## 타입 내보내기

```typescript
import type {
  // Configuration
  TranslationConfig,
  ProviderConfig,

  // Requests/Results
  TranslationRequest,
  TranslationResult,

  // Glossary
  Glossary,
  GlossaryTerm,
  ResolvedGlossary,

  // Quality
  QualityEvaluation,

  // Provider
  LLMProvider,
  ChatMessage,
  ChatResponse,
} from '@llm-translate/cli';
```

## 유틸리티 함수

### Chunking

```typescript
import { chunkContent, chunkMarkdown } from '@llm-translate/cli';

const chunks = chunkContent(text, { maxTokens: 1024 });
const mdChunks = chunkMarkdown(markdown, { maxTokens: 1024 });
```

### 용어집

```typescript
import { loadGlossary, resolveGlossary, createGlossaryLookup } from '@llm-translate/cli';

const glossary = await loadGlossary('./glossary.json');
const resolved = resolveGlossary(glossary, 'ko');
const lookup = createGlossaryLookup(resolved);

const terms = lookup.findAll(sourceText);
```

### 토큰 추정

```typescript
import { estimateTokens, calculateTokenBudget } from '@llm-translate/cli';

const tokens = estimateTokens(text);
const budget = calculateTokenBudget(text, { glossaryTokens: 500 });
```

## 오류 처리

```typescript
import { TranslationError, ErrorCode } from '@llm-translate/cli';

try {
  await engine.translateFile(options);
} catch (error) {
  if (error instanceof TranslationError) {
    switch (error.code) {
      case ErrorCode.FILE_NOT_FOUND:
        // Handle missing file
        break;
      case ErrorCode.QUALITY_THRESHOLD_NOT_MET:
        // Handle quality issue
        console.log('Score:', error.details.score);
        break;
      case ErrorCode.PROVIDER_RATE_LIMITED:
        // Handle rate limit
        break;
    }
  }
}
```

## 오류 코드

| 코드 | 설명 |
|------|-------------|
|`FILE_NOT_FOUND`| 입력 파일이 존재하지 않습니다 |
|`INVALID_CONFIG`| 구성 유효성 검사 실패 |
|`GLOSSARY_NOT_FOUND`| 용어집 파일을 찾을 수 없습니다 |
|`GLOSSARY_INVALID`| 용어집 유효성 검사 실패 |
|`PROVIDER_AUTH_FAILED`| API 키가 유효하지 않습니다 |
|`PROVIDER_RATE_LIMITED`| 속도 제한 초과 |
|`PROVIDER_ERROR`| 일반 제공자 오류 |
|`QUALITY_THRESHOLD_NOT_MET`| 번역 품질이 품질 임계값 이하입니다 |
|`PARSE_ERROR`| 문서 구문 분석 실패 |
