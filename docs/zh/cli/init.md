# llm-translate init

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

为您的项目初始化配置文件。

## 概要

```bash
llm-translate init [options]
```

## 选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | 默认提供商 |
|`--model `,`-m`| 不定 | 默认模型 |
|`--quality`| 85 | 默认质量阈值 |
|`--glossary`| none | 创建术语表模板 |
|`--force `,`-f`| false | 覆盖现有配置 |

## 示例

### 基本初始化

```bash
llm-translate init
```

创建 `.translaterc.json`：

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

### 指定提供商

```bash
llm-translate init --provider openai --model gpt-4o
```

### 使用术语表模板

```bash
llm-translate init --glossary
```

同时创建 `glossary.json`：

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

### 自定义质量

```bash
llm-translate init --quality 95
```

## 交互模式

不带选项时，init 以交互方式运行：

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

## 输出文件

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

### glossary.json（使用 --glossary）

```json
{
  "$schema": "https://llm-translate.dev/glossary-schema.json",
  "sourceLanguage": "en",
  "version": "1.0.0",
  "description": "Project glossary",
  "terms": []
}
```

## 覆盖现有配置

```bash
# Will fail if config exists
llm-translate init
# Error: .translaterc.json already exists. Use --force to overwrite.

# Force overwrite
llm-translate init --force
```
