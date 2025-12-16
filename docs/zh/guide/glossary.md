# 术语表

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

术语表功能确保所有翻译中术语的一致性。定义一次术语，它们每次都会以相同的方式翻译。

## 术语表文件格式

创建一个 `glossary.json` 文件：

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

## 术语结构

### 基本术语

```json
{
  "source": "endpoint",
  "targets": {
    "ko": "엔드포인트",
    "ja": "エンドポイント"
  }
}
```

### 带上下文

上下文帮助 LLM 理解如何使用术语：

```json
{
  "source": "state",
  "targets": { "ko": "상태" },
  "context": "Application state in state management"
}
```

### 不翻译

保持技术术语为英文：

```json
{
  "source": "Kubernetes",
  "doNotTranslate": true
}
```

### 特定语言不翻译

```json
{
  "source": "React",
  "doNotTranslateFor": ["ko", "ja"],
  "targets": {
    "zh": "React框架"
  }
}
```

### 大小写敏感性

```json
{
  "source": "API",
  "targets": { "ko": "API" },
  "caseSensitive": true
}
```

## 完整示例

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

## CLI 命令

### 列出术语表术语

```bash
llm-translate glossary list --glossary glossary.json
```

### 验证术语表

```bash
llm-translate glossary validate --glossary glossary.json
```

### 添加术语

```bash
llm-translate glossary add "container" --target ko="컨테이너" --glossary glossary.json
```

### 删除术语

```bash
llm-translate glossary remove "container" --glossary glossary.json
```

## 最佳实践

### 1. 从常见技术术语开始

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

### 2. 包含产品特定术语

```json
{
  "source": "Workspace",
  "targets": { "ko": "워크스페이스" },
  "context": "Product-specific workspace feature"
}
```

### 3. 为歧义术语添加上下文

```json
{
  "source": "run",
  "targets": { "ko": "실행" },
  "context": "Execute a command or script"
}
```

### 4. 对品牌名称使用 `doNotTranslate`

```json
{
  "source": "GitHub",
  "doNotTranslate": true
}
```

### 5. 版本化您的术语表

跟踪术语表变更与您的文档一起。

## 术语应用方式
