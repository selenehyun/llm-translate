# 快速开始

## 安装

### npm（推荐）

```bash
npm install -g @llm-translate/cli
```

### 从源代码安装

```bash
git clone https://github.com/selenehyun/llm-translate.git
cd llm-translate
npm install
npm run build
npm link
```

## 前置要求

- Node.js 24 或更高版本
- 至少一个 LLM 提供商的 API 密钥：
  - Anthropic (Claude)
  - OpenAI
  - Ollama（本地，无需 API 密钥）

## 配置

### 1. 设置 API 密钥

```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# For OpenAI
export OPENAI_API_KEY=sk-xxxxx

# For Ollama (no key needed, just ensure server is running)
export OLLAMA_BASE_URL=http://localhost:11434
```

### 2. 初始化配置（可选）

```bash
llm-translate init
```

这将创建一个 `.translaterc.json` 文件，包含默认设置：

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

## 你的第一次翻译

### 基本用法

```bash
# Translate a markdown file to Korean
llm-translate file README.md -o README.ko.md --target ko

# Translate with source language specified
llm-translate file docs/guide.md -o docs/guide.ja.md --source en --target ja
```

### 使用术语表

1. 创建一个 `glossary.json` 文件：

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

2. 使用术语表进行翻译：

```bash
llm-translate file README.md -o README.ko.md --target ko --glossary glossary.json
```

### 批量翻译

翻译整个目录：

```bash
llm-translate dir ./docs ./docs-ko --target ko --glossary glossary.json
```

## 理解输出

翻译后，你将看到：

```
✓ Translation complete
  Quality: 92/85 (threshold met)
  Iterations: 2
  Tokens: 1,234 input / 1,456 output
  Cache: 890 read / 234 written (78% hit rate)
  Duration: 3.2s
```

- **Quality**：最终得分与阈值的对比
- **Iterations**：优化循环次数
- **Tokens**：API 令牌使用情况
- **Cache**：提示缓存统计（仅限 Claude）
- **Duration**：总处理时间

## 后续步骤

- [配置你的项目](./configuration)以获得最优设置
- [设置术语表](./glossary)以确保术语一致性
- [了解质量控制](./quality-control)和调优
- [优化成本](./cost-optimization)以适应大型项目
