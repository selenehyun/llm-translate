# Chunking 전략

대규모 문서는 번역을 위해 청크로 분할됩니다. Chunking을 이해하면 품질과 비용을 최적화하는 데 도움이 됩니다.

## Chunking이 필요한 이유

LLM은 컨텍스트 제한이 있으며 집중된 콘텐츠에서 더 잘 작동합니다:

| 이유 | 설명 |
|--------|-------------|
| **컨텍스트 제한** | 모델의 최대 입력 크기가 정해져 있습니다 |
| **품질** | 더 작은 청크는 더 집중된 주의를 받습니다 |
| **비용** | 반복되는 콘텐츠의 프롬프트 캐싱을 허용합니다 |
| **진행 상황** | 진행 상황 추적 및 재개를 가능하게 합니다 |

## 기본 구성

```json
{
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  }
}
```

## 청크 크기 옵션

### maxTokens

청크당 최대 토큰 수(프롬프트 오버헤드 제외).

| 크기 | 최적 용도 | 트레이드오프 |
|------|----------|-----------|
| 512 | 높은 품질 요구사항 | 더 많은 API 호출 |
| **1024** | 일반 용도(기본값) | 균형잡힌 설정 |
| 2048 | 비용 최적화 | 품질 저하 가능성 |

### overlapTokens

이전 청크의 컨텍스트는 경계 전체에서 연속성을 보장합니다.

```
Chunk 1: [Content A                    ]
Chunk 2:            [overlap][Content B                    ]
Chunk 3:                              [overlap][Content C  ]
```

::: tip 권장 오버랩
`maxTokens` 값의 10-15%를 사용하세요. 1024 토큰의 경우 100-150 오버랩 토큰이 적절합니다.
:::

## Markdown 인식 Chunking

llm-translate는 문서 구조를 존중하는 AST 기반 Chunking을 사용합니다.

### 보존된 경계

청커는 다음 요소를 절대 분할하지 않습니다:

| 요소 | 동작 |
|---------|----------|
| 헤더 | 섹션 경계 보존 |
| 코드 블록 | 항상 그대로 유지 |
| 목록 | 가능한 경우 항목 그룹화 |
| 표 | 청크 전체에서 분할 안 함 |
| 단락 | 자연스러운 경계에서 분할 |

### 예시

::: details Chunking 예시를 보려면 클릭하세요

**입력 문서:**

```markdown
# Introduction

This is the introduction paragraph that explains
the purpose of the document.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

npm install @llm-translate/cli
```

**결과:**

```
Chunk 1: # Introduction + paragraph
Chunk 2: ## Getting Started + ### Prerequisites + list
Chunk 3: ### Installation + code block
```

:::

## 구성

::: code-group

```bash [CLI]
llm-translate file doc.md --target ko --chunk-size 2048
```

```json [.translaterc.json]
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200,
    "preservePatterns": [
      "```[\\s\\S]*?```",
      "\\|[^\\n]+\\|"
    ]
  }
}
```

```typescript [Programmatic]
import { chunkContent } from '@llm-translate/cli';

const chunks = chunkContent(content, {
  maxTokens: 1024,
  overlapTokens: 150,
});
```

:::

## 최적화 프리셋

우선순위에 따라 선택하세요:

::: code-group

```json [Quality Focus]
{
  "chunking": {
    "maxTokens": 512,
    "overlapTokens": 100
  }
}
```

```json [Cost Focus]
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 50
  }
}
```

```json [Long Documents]
{
  "chunking": {
    "maxTokens": 1500,
    "overlapTokens": 150
  },
  "translation": {
    "maxIterations": 3
  }
}
```

:::

::: info 각 프리셋을 사용할 때
- **품질 중심**: 기술 문서, 법률 콘텐츠
- **비용 중심**: 블로그 게시물, 일반 콘텐츠
- **긴 문서**: 책, 종합 가이드
:::

## 콘텐츠 보존

### 보호되는 항목

llm-translate는 자동으로 특정 콘텐츠를 번역으로부터 보호합니다:

| 콘텐츠 유형 | 예시 | 동작 |
|--------------|---------|----------|
| 코드 블록 |` __INLINE_CODE_16__ `| 번역되지 않음 |
| 인라인 코드 |`` ` variable ` ``| 보존됨 |
| URL |`https://...`| 보존됨 |
| 파일 경로 |`./path/to/file`| 보존됨 |

### 링크 처리

링크 URL은 보존되지만 링크 텍스트는 번역됩니다:

```markdown
[Getting Started](./getting-started.md)
↓
[시작하기](./getting-started.md)
```

## 디버깅

### 청크 미리보기

`--dry-run` 를 사용하여 문서가 어떻게 청크로 분할될지 확인하세요:

```bash
llm-translate file doc.md --target ko --dry-run --verbose
```

출력:
```
Document Analysis:
  Total tokens: ~5,200
  Chunks: 6
  Average chunk size: ~867 tokens

Chunk breakdown:
  [1] Lines 1-45 (Introduction) - 823 tokens
  [2] Lines 46-89 (Getting Started) - 912 tokens
  [3] Lines 90-134 (Configuration) - 878 tokens
  ...
```

### 프로그래밍 방식 검사

```typescript
import { chunkContent, getChunkStats } from '@llm-translate/cli';

const chunks = chunkContent(content, { maxTokens: 1024 });
const stats = getChunkStats(chunks);

console.log(`Total chunks: ${stats.count}`);
console.log(`Average size: ${stats.avgTokens} tokens`);
```

## 문제 해결

::: warning 청크가 너무 작음
**증상**: 많은 작은 청크, 과도한 API 호출

**해결책**:`maxTokens` 을 증가시키세요
```json
{ "chunking": { "maxTokens": 2048 } }
```
:::

::: warning 청크 간 컨텍스트 손실
**증상**: 섹션 전체에서 일관되지 않은 용어

**해결책**: 오버랩을 증가시키거나 용어집을 사용하세요
```json
{ "chunking": { "overlapTokens": 300 } }
```
:::

::: danger 코드 블록이 분할됨
**증상**: 출력에서 구문 오류 발생

**원인**: 이는 절대 발생하지 않아야 합니다. 발생하면 [문제를 보고해주세요](https://github.com/selenehyun/llm-translate/issues).
:::

::: warning 표가 손상됨
**증상**: 표 형식이 깨짐

**해결책**: 표는 자동으로 그대로 유지되어야 합니다. 매우 큰 표(100개 이상의 행)의 경우 수동으로 분할하는 것을 고려하세요.
:::
