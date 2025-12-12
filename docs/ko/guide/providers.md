# 제공자

llm-translate는 여러 LLM 제공자를 지원합니다. 각 제공자는 서로 다른 장점과 트레이드오프를 가지고 있습니다.

## 지원되는 제공자

| 제공자 | 캐싱 | 최적 용도 | 설정 복잡도 |
|----------|---------|----------|------------------|
| Claude | 전체 | 품질 + 비용 | 쉬움 |
| OpenAI | 자동 | 에코시스템 | 쉬움 |
| Ollama | 없음 | 프라이버시/오프라인 | 중간 |

## Claude (권장)

### Claude를 선택하는 이유

- **프롬프트 캐싱**: 최대 90% 비용 절감
- **높은 품질**: 우수한 번역 정확도
- **긴 컨텍스트**: 200K 토큰 컨텍스트 윈도우
- **다양한 계층**: Haiku (빠름), Sonnet (균형), Opus (최고)

### 설정

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 모델 선택

```bash
# Fast and cheap (default)
llm-translate file doc.md --target ko --model claude-haiku-4-5-20251001

# Balanced quality/cost
llm-translate file doc.md --target ko --model claude-sonnet-4-5-20250929

# Highest quality
llm-translate file doc.md --target ko --model claude-opus-4-5-20251101
```

### 각 모델 사용 시기

| 모델 | 사용 사례 |
|-------|----------|
| Haiku | README 파일, 간단한 문서, 대량 처리 |
| Sonnet | 기술 문서, API 참고자료 |
| Opus | 법률, 마케팅, 뉘앙스 있는 콘텐츠 |

## OpenAI

### 설정

```bash
export OPENAI_API_KEY=sk-xxxxx
```

### 사용법

```bash
llm-translate file doc.md --target ko --provider openai --model gpt-4o
```

### 사용 가능한 모델

| 모델 | 속도 | 품질 | 비용 |
|-------|-------|---------|------|
| GPT-4o-mini | 빠름 | 좋음 | 매우 낮음 |
| GPT-4o | 중간 | 우수 | 중간 |
| gpt-4-turbo | 중간 | 우수 | 높음 |

### 사용 시기

- 이미 다른 서비스에 OpenAI를 사용 중인 경우
- 특정 OpenAI 기능이 필요한 경우
- Azure OpenAI를 선호하는 경우 (사용자 정의 baseUrl 설정)

## Ollama

프라이버시 또는 오프라인 사용을 위한 로컬 자체 호스팅 LLM입니다.

### 설정

1. Ollama 설치:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

2. 모델 다운로드:

```bash
ollama pull llama3.1
```

3. 서버 시작:

```bash
ollama serve
```

### 사용법

```bash
export OLLAMA_BASE_URL=http://localhost:11434

llm-translate file doc.md --target ko --provider ollama --model llama3.1
```

### 권장 모델

| 모델 | 파라미터 | 품질 | 속도 |
|-------|-----------|---------|-------|
| llama3.1 | 8B | 좋음 | 빠름 |
| llama3.1:70b | 70B | 우수 | 느림 |
| mistral | 7B | 좋음 | 빠름 |
| mixtral | 8x7B | 매우 좋음 | 중간 |

### 제한사항

- 프롬프트 캐싱 없음 (대용량 문서의 경우 높은 비용)
- 모델에 따라 품질이 달라짐
- 좋은 성능을 위해 로컬 GPU 필요
- 일부 모델의 제한된 언어 지원

### 사용 시기

- 민감한/개인 문서
- 오프라인 환경
- 비용 최적화 (API 요금 없음)
- 실험

## 제공자 비교

### 품질

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Llama3.1
```

### 비용 (1M 토큰당)

```
Ollama ($0) < Haiku ($1) < GPT-4o-mini ($0.15) < Sonnet ($3) < GPT-4o ($2.5) < Opus ($15)
```

### 속도

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies)
```

## 제공자 전환

### CLI

```bash
# Different providers
llm-translate file doc.md --target ko --provider claude
llm-translate file doc.md --target ko --provider openai
llm-translate file doc.md --target ko --provider ollama
```

### 설정 파일

```json
{
  "provider": {
    "name": "openai",
    "model": "gpt-4o"
  }
}
```

### 프로그래밍 방식

```typescript
import {
  createClaudeProvider,
  createOpenAIProvider,
  createOllamaProvider,
  TranslationEngine,
} from '@llm-translate/cli';

// Switch providers easily
const providers = {
  claude: createClaudeProvider(),
  openai: createOpenAIProvider(),
  ollama: createOllamaProvider(),
};

const engine = new TranslationEngine({
  provider: providers[selectedProvider],
});
```

## 폴백 설정

안정성을 위해 폴백 제공자를 설정합니다:

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001",
    "fallback": [
      { "name": "openai", "model": "gpt-4o-mini" },
      { "name": "ollama", "model": "llama3.1" }
    ]
  }
}
```

## 사용자 정의 엔드포인트

### Azure OpenAI

```json
{
  "provider": {
    "name": "openai",
    "baseUrl": "https://your-resource.openai.azure.com",
    "apiKey": "your-azure-key"
  }
}
```

### 자체 호스팅

```json
{
  "provider": {
    "name": "ollama",
    "baseUrl": "https://your-server.com:11434"
  }
}
```
