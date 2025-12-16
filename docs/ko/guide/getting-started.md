# 시작하기

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

## 설치

### npm (권장)

```bash
npm install -g @llm-translate/cli
```

### 소스에서 설치

```bash
git clone https://github.com/selenehyun/llm-translate.git
cd llm-translate
npm install
npm run build
npm link
```

## 사전 요구사항

- Node.js 24 이상
- 최소 하나의 LLM 제공자에 대한 API 키:
  - Anthropic (Claude)
  - OpenAI
  - Ollama (로컬, API 키 불필요)

## 구성

### 1. API 키 설정

```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# For OpenAI
export OPENAI_API_KEY=sk-xxxxx

# For Ollama (no key needed, just ensure server is running)
# See the Ollama guide for setup: ./ollama
export OLLAMA_BASE_URL=http://localhost:11434
```

### 2. 구성 초기화 (선택사항)

```bash
llm-translate init
```

이는 기본 설정으로 `.translaterc.json` 파일을 생성합니다:

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001"
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 4
  },
  "paths": {
    "glossary": "./glossary.json"
  }
}
```

## 첫 번째 번역

### 기본 사용법

```bash
# Translate a markdown file to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# Using long option names
llm-translate file docs/guide.md -o docs/guide.ja.md --source-lang en --target-lang ja
```

### 용어집 사용

1. `glossary.json` 파일을 생성합니다:

```json
{
  "sourceLanguage": "en",
  "terms": [
    {
      "source": "component",
      "targets": { "ko": "컴포넌트" },
      "context": "UI component"
    },
    {
      "source": "prop",
      "targets": { "ko": "프롭" },
      "context": "React prop"
    },
    {
      "source": "TypeScript",
      "doNotTranslate": true
    }
  ]
}
```

2. 용어집과 함께 번역합니다:

```bash
llm-translate file README.md -o README.ko.md -s en -t ko --glossary glossary.json
```

### 일괄 번역

전체 디렉토리를 번역합니다:

```bash
llm-translate dir ./docs ./docs-ko -s en -t ko --glossary glossary.json
```

## 출력 결과 이해하기

번역 후 다음과 같은 정보를 확인할 수 있습니다:

```
✓ Translation complete
  Quality: 92/85 (threshold met)
  Iterations: 2
  Tokens: 1,234 input / 1,456 output
  Cache: 890 read / 234 written (78% hit rate)
  Duration: 3.2s
```

- **Quality**: 최종 점수 대 임계값
- **Iterations**: 개선 사이클 수
- **Tokens**: API 토큰 사용량
- **Cache**: 프롬프트 캐싱 통계 (Claude만 해당)
- **Duration**: 총 처리 시간

## 다음 단계

- 최적 설정을 위한 [프로젝트 구성](./configuration)
- 일관된 용어를 위한 [용어집 설정](./glossary)
- [품질 제어](./quality-control) 및 튜닝 이해
- 대규모 프로젝트를 위한 [비용 최적화](./cost-optimization)
- 비공개 오프라인 번역을 위한 [Ollama로 로컬 실행](./ollama)
