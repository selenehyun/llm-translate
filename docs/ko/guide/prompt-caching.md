# 프롬프트 캐싱

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

프롬프트 캐싱은 반복되는 콘텐츠에 대해 API 비용을 최대 90%까지 절감하는 비용 최적화 기능입니다.

## 작동 원리

문서를 번역할 때 프롬프트의 특정 부분은 일정하게 유지됩니다:

- **시스템 지침**: 번역 규칙 및 가이드라인
- **용어집**: 도메인별 전문 용어

이러한 내용은 캐시되어 여러 청크에서 재사용되므로 상당한 비용을 절약할 수 있습니다.

```
Request 1 (First Chunk):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Written to cache
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Written to cache
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘

Request 2+ (Subsequent Chunks):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘
```

## 비용 영향

### 가격 (Claude)

| 토큰 유형 | 비용 배수 |
|------------|-----------------|
| 일반 입력 | 1.0x |
| 캐시 쓰기 | 1.25x (첫 사용) |
| 캐시 읽기 | 0.1x (이후) |
| 출력 | 1.0x |

### 계산 예시

500토큰 용어집이 있는 10청크 문서의 경우:

**캐싱 없이:**
```
10 chunks × 500 glossary tokens = 5,000 tokens
```

**캐싱 사용:**
```
First chunk: 500 × 1.25 = 625 tokens (cache write)
9 chunks: 500 × 0.1 × 9 = 450 tokens (cache read)
Total: 1,075 tokens (78% savings)
```

## 요구사항

### 최소 토큰 임계값

프롬프트 캐싱에는 최소 콘텐츠 길이가 필요합니다:

| 모델 | 최소 토큰 |
|-------|---------------|
| Claude Haiku 4.5 | 4,096 |
| Claude Haiku 3.5 | 2,048 |
| Claude Sonnet | 1,024 |
| Claude Opus | 1,024 |

이 임계값 미만의 콘텐츠는 캐시되지 않습니다.

### 제공자 지원

| 제공자 | 캐싱 지원 |
|----------|-----------------|
| Claude | ✅ 완전 지원 |
| OpenAI | ✅ 자동 |
| Ollama | ❌ 사용 불가 |

## 구성

Claude의 경우 캐싱이 기본적으로 활성화됩니다. 비활성화하려면:

```bash
llm-translate file doc.md -o doc.ko.md --target ko --no-cache
```

또는 설정에서:

```json
{
  "provider": {
    "name": "claude",
    "caching": false
  }
}
```

## 캐시 성능 모니터링

### CLI 출력

```
✓ Translation complete
  Cache: 890 read / 234 written (78% hit rate)
```

### 상세 모드

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

청크별 캐시 통계를 표시합니다:

```
[Chunk 1/10] Cache: 0 read / 890 written
[Chunk 2/10] Cache: 890 read / 0 written
[Chunk 3/10] Cache: 890 read / 0 written
...
```

### 프로그래밍 방식 접근

```typescript
const result = await engine.translateFile({
  input: 'doc.md',
  output: 'doc.ko.md',
  targetLang: 'ko',
});

console.log(result.metadata.tokensUsed);
// {
//   input: 5000,
//   output: 6000,
//   cacheRead: 8000,
//   cacheWrite: 1000
// }
```

## 캐시 효율성 극대화

### 1. 일관된 용어집 사용

동일한 용어집 콘텐츠 = 동일한 캐시 키

```bash
# Good: Same glossary for all files
llm-translate dir ./docs ./docs-ko --target ko --glossary glossary.json

# Less efficient: Different glossary per file
llm-translate file a.md --glossary a-glossary.json
llm-translate file b.md --glossary b-glossary.json
```

### 2. 관련 파일 일괄 처리

캐시는 약 5분간 지속됩니다. 파일을 함께 처리하세요:

```bash
# Efficient: Sequential processing shares cache
llm-translate dir ./docs ./docs-ko --target ko
```

### 3. 크기별로 파일 정렬

캐시를 워밍하기 위해 큰 파일부터 시작하세요:

```bash
# Cache is populated by first file, reused by rest
llm-translate file large-doc.md ...
llm-translate file small-doc.md ...
```

### 4. 전략적으로 큰 용어집 사용

큰 용어집일수록 캐싱의 이점이 더 큽니다:

| 용어집 크기 | 캐시 절약 |
|---------------|---------------|
| 100 토큰 | ~70% |
| 500 토큰 | ~78% |
| 1000+ 토큰 | ~80%+ |

## 문제 해결

### 캐시가 작동하지 않음

**증상:**`cacheRead` 토큰이 보고되지 않음

**원인:**
1. 최소 임계값 미만의 콘텐츠
2. 요청 간 콘텐츠 변경
3. 캐시 TTL 만료 (5분)

**해결책:**
- 용어집 + 시스템 프롬프트가 최소 토큰을 초과하는지 확인
- 파일을 연속적으로 빠르게 처리
- 디버깅을 위해 상세 모드 사용

### 높은 캐시 쓰기 비용

**증상:** 예상보다 많은 `cacheWrite`

**원인:**
1. 많은 고유 용어집
2. 파일 처리 간격이 너무 긺
3. 실행 간 캐시 무효화

**해결책:**
- 용어집 통합
- 일괄 처리 사용
- 5분 창 내에서 처리
