# 비용 최적화

이 가이드는 번역 품질을 유지하면서 API 비용을 최소화하는 전략을 다룹니다.

## 비용 구조

### 토큰 가격 책정 (2025년 기준)

| 모델 | 입력 (1K) | 출력 (1K) | 캐시 읽기 | 캐시 쓰기 |
|-------|-----------|-------------|-----------|-----------|
| Claude Haiku 4.5 | $0.001 | $0.005 | $0.0001 | $0.00125 |
| Claude Sonnet 4.5 | $0.003 | $0.015 | $0.0003 | $0.00375 |
| Claude Opus 4.5 | $0.015 | $0.075 | $0.0015 | $0.01875 |
| GPT-4o-mini | $0.00015 | $0.0006 | 자동 | 자동 |
| GPT-4o | $0.0025 | $0.01 | 자동 | 자동 |

### 비용 요소

1. **입력 토큰**: 원본 텍스트 + 용어집 + 프롬프트
2. **출력 토큰**: 번역된 텍스트
3. **반복**: 품질 개선 사이클 (반복 횟수로 곱함)
4. **캐시 효율성**: 프롬프트 캐싱으로 인한 절감

## 최적화 전략

### 1. 올바른 모델 선택

```bash
# Most cost-effective for standard docs
llm-translate file doc.md --model claude-haiku-4-5-20251001

# Better quality when needed
llm-translate file important.md --model claude-sonnet-4-5-20250929
```

**모델 선택 가이드:**

| 콘텐츠 유형 | 권장 모델 |
|------------|----------|
| README, 가이드 | Haiku |
| API 참조 | Haiku |
| 사용자 대면 문서 | Sonnet |
| 마케팅 콘텐츠 | Sonnet/Opus |
| 법률/규정 준수 | Opus |

### 2. 품질 설정 최적화

낮은 임계값 = 더 적은 반복 = 낮은 비용

```bash
# Draft quality (faster, cheaper)
llm-translate file doc.md --quality 70 --max-iterations 2

# Standard quality
llm-translate file doc.md --quality 85 --max-iterations 4

# High quality (slower, more expensive)
llm-translate file doc.md --quality 95 --max-iterations 6
```

**비용 영향:**

| 설정 | 평균 반복 | 상대 비용 |
|------|---------|---------|
| quality=70, iter=2 | 1.5 | 0.5x |
| quality=85, iter=4 | 2.5 | 1.0x |
| quality=95, iter=6 | 4.0 | 1.6x |

### 3. 프롬프트 캐싱 최대화

캐싱을 활성화하고 파일을 배치로 처리합니다:

```bash
# Process all files together to share cache
llm-translate dir ./docs ./docs-ko --target ko

# Not: Process one file at a time
```

자세한 내용은 [프롬프트 캐싱](./prompt-caching)을 참조하십시오.

### 4. 용어집 크기 최적화

큰 용어집은 비용을 증가시킵니다. 필요한 용어만 유지하십시오:

```bash
# Check glossary token count
llm-translate glossary stats --glossary glossary.json
```

**모범 사례:**
- 사용하지 않는 용어를 정기적으로 제거합니다
-`doNotTranslate` 을 드물게 사용합니다
- 큰 용어집을 도메인별로 분할합니다

### 5. 청크 크기 최적화

더 큰 청크 = 더 적은 API 호출 = 낮은 오버헤드

```json
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200
  }
}
```

**트레이드오프:**

| 청크 크기 | API 호출 | 품질 | 비용 |
|---------|---------|------|------|
| 512 토큰 | 많음 | 높음 | 높음 |
| 1024 토큰 | 중간 | 좋음 | 중간 |
| 2048 토큰 | 적음 | 수용 가능 | 낮음 |

### 6. 번역 캐시 사용

번역된 청크를 캐시하여 재번역을 방지합니다:

```json
{
  "paths": {
    "cache": "./.translate-cache"
  }
}
```

이점:
- 재실행 시 변경되지 않은 콘텐츠 건너뛰기
- 증분 업데이트에 대한 비용 감소
- 후속 번역 속도 향상

## 비용 추정

### 번역 전

```bash
llm-translate estimate doc.md --target ko --glossary glossary.json
```

출력:
```
Estimated costs for doc.md:
  Chunks: 15
  Input tokens: ~18,000
  Output tokens: ~20,000 (estimated)
  Iterations: 2-3 (estimated)

  Model: claude-haiku-4-5-20251001
  Without caching: $0.12 - $0.18
  With caching: $0.05 - $0.08 (55-60% savings)
```

### 번역 후

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

출력:
```
✓ Translation complete
  Tokens: 18,234 input / 21,456 output
  Cache: 12,000 read / 3,000 written
  Cost: $0.067 (estimated)
```

## 배치 처리 경제학

### 단일 파일 vs 배치

| 접근 방식 | 캐시 효율성 | 총 비용 |
|---------|-----------|--------|
| 10개 파일 순차 처리 | 0% | $1.00 |
| 캐싱을 사용한 10개 파일 | 80% | $0.35 |
| 배치 디렉토리 | 85% | $0.30 |

### 최적 배치 크기

```bash
# Process in batches of 20-50 files for best cache utilization
llm-translate dir ./docs ./docs-ko --target ko --concurrency 5
```

## 비용 모니터링

### 프로젝트별 추적

비용 로그를 생성합니다:

```bash
llm-translate file doc.md --cost-log ./costs.json
```

### 비용 알림

예산 한도를 설정합니다:

```json
{
  "budget": {
    "maxCostPerFile": 0.50,
    "maxCostPerRun": 10.00,
    "warnAt": 0.80
  }
}
```

## 언어별 비용 비교

출력은 대상 언어에 따라 다릅니다:

| 대상 | 상대 출력 토큰 |
|-----|-------------|
| 한국어 | 0.9-1.1x 원본 |
| 일본어 | 0.8-1.0x 원본 |
| 중국어 | 0.7-0.9x 원본 |
| 독일어 | 1.1-1.3x 원본 |
| 스페인어 | 1.1-1.2x 원본 |

비용 추정에 이를 고려하십시오.

## 요약: 빠른 비용 절감 체크리스트

- [ ] 표준 문서에는 Haiku를 사용하세요
- [ ] 품질 임계값을 적절하게 설정하세요 (필요 이상으로 높게 설정하지 마세요)
- [ ] 프롬프트 캐싱을 활성화하고 최대한 활용하세요
- [ ] 파일을 배치로 처리하세요
- [ ] 용어집을 간결하게 유지하세요
- [ ] 증분 업데이트를 위해 번역 캐시를 사용하세요
- [ ] 상세 출력으로 비용을 모니터링하세요
- [ ] 대규모 작업 전에 비용을 추정하세요
