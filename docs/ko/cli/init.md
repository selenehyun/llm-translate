# llm-translate init

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

프로젝트를 위한 설정 파일을 초기화합니다.

## 개요

```bash
llm-translate init [options]
```

## 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | 기본 제공자 |
|`--model `,`-m`| 다양함 | 기본 모델 |
|`--quality`| 85 | 기본 품질 임계값 |
|`--glossary`| 없음 | 용어집 템플릿 생성 |
|`--force `,`-f`| false | 기존 설정 덮어쓰기 |

## 예제

### 기본 초기화

```bash
llm-translate init
```

`.translaterc.json` 를 생성합니다:

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
  "paths": {}
}
```

### 제공자 지정

```bash
llm-translate init --provider openai --model gpt-4o
```

### 용어집 템플릿과 함께

```bash
llm-translate init --glossary
```

또한 `glossary.json` 를 생성합니다:

```json
{
  "sourceLanguage": "en",
  "version": "1.0.0",
  "terms": [
    {
      "source": "example",
      "targets": {
        "ko": "예시"
      },
      "context": "Replace with your terms"
    }
  ]
}
```

### 사용자 정의 품질

```bash
llm-translate init --quality 95
```

## 대화형 모드

옵션 없이 실행하면 init가 대화형으로 실행됩니다:

```
$ llm-translate init

llm-translate Configuration Setup

? Select provider: (Use arrow keys)
❯ claude
  openai
  ollama

? Select model: (Use arrow keys)
❯ claude-haiku-4-5-20251001 (fast, cost-effective)
  claude-sonnet-4-5-20250929 (balanced)
  claude-opus-4-5-20251101 (highest quality)

? Quality threshold: (85)
? Create glossary template? (y/N)

✓ Created .translaterc.json
```

## 출력 파일

### .translaterc.json

```json
{
  "$schema": "https://llm-translate.dev/schema.json",
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001"
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

### glossary.json (--glossary와 함께)

```json
{
  "$schema": "https://llm-translate.dev/glossary-schema.json",
  "sourceLanguage": "en",
  "version": "1.0.0",
  "description": "Project glossary",
  "terms": []
}
```

## 기존 설정 덮어쓰기

```bash
# Will fail if config exists
llm-translate init
# Error: .translaterc.json already exists. Use --force to overwrite.

# Force overwrite
llm-translate init --force
```
