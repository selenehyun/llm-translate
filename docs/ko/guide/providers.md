# 제공자

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

llm-translate는 여러 LLM 제공자를 지원합니다. 각각은 서로 다른 장점과 트레이드오프를 가지고 있습니다.

## 지원되는 제공자

| 제공자 | 캐싱 | 최적 용도 | 설정 복잡도 |
|----------|---------|----------|------------------|
| Claude | 완전 지원 | 품질 + 비용 | 쉬움 |
| OpenAI | 자동 | 생태계 | 쉬움 |
| Ollama | 없음 | 프라이버시/오프라인 | 보통 |

## Claude (권장)

### Claude를 선택하는 이유?

- **프롬프트 캐싱**: 최대 90% 비용 절감
- **높은 품질**: 뛰어난 번역 정확도
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
| Haiku | README 파일, 간단한 문서, 대용량 |
| Sonnet | 기술 문서, API 참조 |
| Opus | 법률, 마케팅, 미묘한 내용 |

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
| gpt-4o-mini | 빠름 | 좋음 | 매우 낮음 |
| gpt-4o | 보통 | 뛰어남 | 보통 |
| gpt-4-turbo | 보통 | 뛰어남 | 높음 |

### 사용 시기

- 다른 서비스에서 이미 OpenAI를 사용하는 경우
- 특정 OpenAI 기능이 필요한 경우
- Azure OpenAI를 선호하는 경우 (사용자 정의 baseUrl 설정)

## Ollama

프라이버시나 오프라인 사용을 위한 로컬, 자체 호스팅 LLM입니다. API 키가 필요하지 않습니다.

::: warning 모델에 따라 품질이 달라집니다
Ollama 번역 품질은 **모델 선택에 크게 의존합니다**. 신뢰할 수 있는 번역 결과를 위해서는:

- **최소**: 14B+ 매개변수 모델 (예:`qwen2.5:14b `,` llama3.1:14b`)
- **권장**: 32B+ 모델 (예:`qwen2.5:32b `,` llama3.3:70b`)
- **권장하지 않음**: 7B 미만 모델은 일관성이 없고 종종 사용할 수 없는 번역을 생성합니다

작은 모델(3B, 7B)은 간단한 내용에서는 작동할 수 있지만 기술 문서에서는 자주 실패하거나, 불완전한 출력을 생성하거나, 형식 지침을 무시합니다.
:::

### 빠른 설정

```bash
# 1. Install (macOS)
brew install ollama

# 2. Pull qwen2.5:14b (recommended)
ollama pull qwen2.5:14b

# 3. Translate
llm-translate file doc.md -s en -t ko --provider ollama --model qwen2.5:14b
```

### 권장 모델

| 모델 | RAM | 품질 | 최적 용도 |
|-------|-----|---------|----------|
|`qwen2.5:14b`| 16GB | 매우 좋음 | **최고의 균형 (권장)** |
|`qwen2.5:32b`| 32GB | 뛰어남 | 더 높은 품질 |
|`llama3.1:8b`| 8GB | 좋음 | 가벼운 무게 |
|`llama3.2`| 4GB | 보통 | 간단한 내용만 |

### 사용 시기

- 민감한/개인 문서
- 오프라인 환경
- 비용 최적화 (API 수수료 없음)
- 간단하거나 보통 복잡도의 내용

::: tip 전체 가이드
완전한 설정 지침, GPU 최적화, 문제 해결 및 고급 구성은 [Ollama를 사용한 로컬 번역](./ollama)을 참조하세요.
:::

## 제공자 비교

### 품질

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Qwen2.5:32b > Qwen2.5:14b
```

### 비용 (100만 토큰당)

```
Ollama ($0) < GPT-4o-mini ($0.15) < Haiku ($1) < GPT-4o ($2.5) < Sonnet ($3) < Opus ($15)
```

### 속도

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies with hardware)
```

## 제공자 전환

### CLI

```bash
# Different providers
llm-translate file doc.md -s en -t ko --provider claude
llm-translate file doc.md -s en -t ko --provider openai
llm-translate file doc.md -s en -t ko --provider ollama
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

## 폴백 구성

신뢰성을 위한 폴백 제공자를 구성합니다:

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
