# 용어집

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

용어집 기능은 모든 번역에서 일관된 용어 사용을 보장합니다. 용어를 한 번 정의하면 매번 동일한 방식으로 번역됩니다.

## 용어집 파일 형식

`glossary.json` 파일을 생성합니다:

```json
{
  "sourceLanguage": "en",
  "version": "1.0.0",
  "terms": [
    {
      "source": "component",
      "targets": {
        "ko": "컴포넌트",
        "ja": "コンポーネント",
        "zh": "组件"
      },
      "context": "UI component in React/Vue"
    }
  ]
}
```

## 용어 구조

### 기본 용어

```json
{
  "source": "endpoint",
  "targets": {
    "ko": "엔드포인트",
    "ja": "エンドポイント"
  }
}
```

### 컨텍스트 포함

컨텍스트는 LLM이 용어를 사용하는 방법을 이해하는 데 도움이 됩니다:

```json
{
  "source": "state",
  "targets": { "ko": "상태" },
  "context": "Application state in state management"
}
```

### 번역하지 않음

기술 용어를 영어로 유지합니다:

```json
{
  "source": "Kubernetes",
  "doNotTranslate": true
}
```

### 특정 언어에 대해 번역하지 않음

```json
{
  "source": "React",
  "doNotTranslateFor": ["ko", "ja"],
  "targets": {
    "zh": "React框架"
  }
}
```

### 대소문자 구분

```json
{
  "source": "API",
  "targets": { "ko": "API" },
  "caseSensitive": true
}
```

## 완전한 예제

```json
{
  "sourceLanguage": "en",
  "version": "1.0.0",
  "description": "Technical documentation glossary",
  "terms": [
    {
      "source": "component",
      "targets": { "ko": "컴포넌트", "ja": "コンポーネント" },
      "context": "UI component"
    },
    {
      "source": "prop",
      "targets": { "ko": "프롭", "ja": "プロップ" },
      "context": "React component property"
    },
    {
      "source": "hook",
      "targets": { "ko": "훅", "ja": "フック" },
      "context": "React hook (useState, useEffect, etc.)"
    },
    {
      "source": "state",
      "targets": { "ko": "상태", "ja": "ステート" },
      "context": "Component or application state"
    },
    {
      "source": "TypeScript",
      "doNotTranslate": true
    },
    {
      "source": "JavaScript",
      "doNotTranslate": true
    },
    {
      "source": "npm",
      "doNotTranslate": true
    },
    {
      "source": "API",
      "doNotTranslate": true,
      "caseSensitive": true
    }
  ]
}
```

## CLI 명령어

### 용어집 용어 목록 보기

```bash
llm-translate glossary list --glossary glossary.json
```

### 용어집 검증

```bash
llm-translate glossary validate --glossary glossary.json
```

### 용어 추가

```bash
llm-translate glossary add "container" --target ko="컨테이너" --glossary glossary.json
```

### 용어 제거

```bash
llm-translate glossary remove "container" --glossary glossary.json
```

## 모범 사례

### 1. 일반적인 기술 용어부터 시작

```json
{
  "terms": [
    { "source": "API", "doNotTranslate": true },
    { "source": "SDK", "doNotTranslate": true },
    { "source": "CLI", "doNotTranslate": true },
    { "source": "URL", "doNotTranslate": true },
    { "source": "JSON", "doNotTranslate": true }
  ]
}
```

### 2. 제품별 용어 포함

```json
{
  "source": "Workspace",
  "targets": { "ko": "워크스페이스" },
  "context": "Product-specific workspace feature"
}
```

### 3. 모호한 용어에 컨텍스트 추가

```json
{
  "source": "run",
  "targets": { "ko": "실행" },
  "context": "Execute a command or script"
}
```

### 4. 브랜드명에 `doNotTranslate` 사용

```json
{
  "source": "GitHub",
  "doNotTranslate": true
}
```

### 5. 용어집 버전 관리

문서와 함께 용어집 변경 사항을 추적합니다.

## 용어 적용 방식
