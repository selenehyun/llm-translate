# 术语表

术语表功能确保所有翻译中的术语保持一致。定义一次术语，它们每次都会以相同的方式翻译。

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

### 带有上下文

上下文帮助 LLM 理解如何使用该术语：

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

### 针对特定语言不翻译

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

### 3. 为模糊术语添加上下文

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

### 5. 对术语表进行版本控制

跟踪术语表更改以及您的文档。

## 术语如何被应用

1. **翻译前**：术语表被注入到提示中
2. **翻译期间**：LLM 看到每个术语所需的翻译
3. **质量评估**：术语表合规性被评分（占总分的 20%）
4. **优化**：缺失的术语被标记以供更正

## 故障排除

### 术语未被应用

- 检查大小写敏感性设置
- 确保术语在源文本中完全按定义出现
- 验证目标语言在 `targets` 对象中

### 翻译不一致

- 添加更多上下文以消除歧义
- 检查是否存在具有不同翻译的重复术语
- 提高质量阈值以强制合规

### 术语表过大

大型术语表会增加令牌使用量。考虑：

- 按域/项目拆分
- 使用选择性术语表注入（即将推出）
- 删除很少使用的术语
