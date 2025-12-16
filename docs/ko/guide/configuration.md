# 설정

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

llm-translate는 계층화된 설정 시스템을 사용합니다. 설정은 다음 순서로 적용됩니다(나중 설정이 이전 설정을 덮어씁니다):

1. 내장 기본값
2. 설정 파일 (`.translaterc.json`)
3. 환경 변수
4. CLI 인수

## 설정 파일

프로젝트 루트에 `.translaterc.json` 를 생성하세요:

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001",
    "apiKey": null
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 4,
    "preserveFormatting": true
  },
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  },
  "paths": {
    "glossary": "./glossary.json",
    "cache": "./.translate-cache"
  }
}
```

### 제공자 설정

| 옵션 | 타입 | 기본값 | 설명 |
|--------|------|---------|-------------|
|`name `| string |`"claude"`| 제공자 이름:` claude `,` openai `,` ollama`|
|`model`| string | 다양함 | 모델 식별자 |
|`apiKey`| string | null | API 키 (환경 변수 권장) |
|`baseUrl`| string | null | 사용자 정의 API 엔드포인트 |

### 번역 설정

| 옵션 | 타입 | 기본값 | 설명 |
|--------|------|---------|-------------|
|`qualityThreshold `| number |` 85`| 최소 품질 점수 (0-100) |
|`maxIterations `| number |` 4`| 최대 개선 반복 횟수 |
|`preserveFormatting `| boolean |` true`| Markdown/HTML 구조 보존 |

### Chunking 설정

| 옵션 | 타입 | 기본값 | 설명 |
|--------|------|---------|-------------|
|`maxTokens `| number |` 1024`| 청크당 최대 토큰 수 |
|`overlapTokens `| number |` 150`| 청크 간 컨텍스트 중복 |

### 경로 설정

| 옵션 | 타입 | 기본값 | 설명 |
|--------|------|---------|-------------|
|`glossary`| string | null | 용어집 파일 경로 |
|`cache`| string | null | 번역 캐시 경로 |

## 환경 변수

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Default Settings
LLM_TRANSLATE_PROVIDER=claude
LLM_TRANSLATE_MODEL=claude-haiku-4-5-20251001
LLM_TRANSLATE_QUALITY_THRESHOLD=85
```

## CLI 재정의 예시

```bash
# Override provider
llm-translate file doc.md -o doc.ko.md --target ko --provider openai

# Override model
llm-translate file doc.md -o doc.ko.md --target ko --model claude-sonnet-4-5-20250929

# Override quality threshold
llm-translate file doc.md -o doc.ko.md --target ko --quality 90

# Override max iterations
llm-translate file doc.md -o doc.ko.md --target ko --max-iterations 6
```

## 프로젝트별 설정

모노레포나 다중 프로젝트 설정의 경우, 각 프로젝트 디렉토리에 `.translaterc.json` 을 배치하세요:

```
my-monorepo/
├── packages/
│   ├── frontend/
│   │   ├── .translaterc.json  # Frontend-specific terms
│   │   └── docs/
│   └── backend/
│       ├── .translaterc.json  # Backend-specific terms
│       └── docs/
└── .translaterc.json          # Shared defaults
```

llm-translate는 현재 디렉토리부터 상위로 설정 파일을 검색합니다.

## 모델 선택 가이드

| 모델 | 속도 | 품질 | 비용 | 최적 용도 |
|-------|-------|---------|------|----------|
|`claude-haiku-4-5-20251001`| 빠름 | 좋음 | 낮음 | 일반 문서, 대용량 |
|`claude-sonnet-4-5-20250929`| 보통 | 우수 | 보통 | 기술 문서, 품질 중요 |
|`claude-opus-4-5-20251101`| 느림 | 최고 | 높음 | 복잡한 내용, 미묘한 텍스트 |
|`gpt-4o-mini`| 빠름 | 좋음 | 낮음 | Haiku 대안 |
|`gpt-4o`| 보통 | 우수 | 보통 | Sonnet 대안 |

## 품질 임계값 가이드라인

| 임계값 | 사용 사례 |
|-----------|----------|
| 70-75 | 초안 번역, 내부 문서 |
| 80-85 | 표준 문서 (기본값) |
| 90-95 | 공개용, 마케팅 콘텐츠 |
| 95+ | 법률, 의료, 규제 콘텐츠 |

높은 임계값은 더 많은 반복이 필요하며 비용이 더 많이 듭니다.
