# 快速开始

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

## 安装

### npm（推荐）

```bash
npm install -g @llm-translate/cli
```

### 从源码安装

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
  - Ollama（本地运行，无需 API 密钥）

## 配置

### 1. 设置 API 密钥

```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# For OpenAI
export OPENAI_API_KEY=sk-xxxxx

# For Ollama (no key needed, just ensure server is running)
# See the Ollama guide for setup: ./ollama
export OLLAMA_BASE_URL=http://localhost:11434
```

### 2. 初始化配置（可选）

```bash
llm-translate init
```

这将创建一个包含默认设置的 `.translaterc.json` 文件：

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

## 第一次翻译

### 基本用法

```bash
# Translate a markdown file to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# Using long option names
llm-translate file docs/guide.md -o docs/guide.ja.md --source-lang en --target-lang ja
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
llm-translate file README.md -o README.ko.md -s en -t ko --glossary glossary.json
```

### 批量翻译

翻译整个目录：

```bash
llm-translate dir ./docs ./docs-ko -s en -t ko --glossary glossary.json
```

## 理解输出结果

翻译完成后，您将看到：

```
✓ Translation complete
  Quality: 92/85 (threshold met)
  Iterations: 2
  Tokens: 1,234 input / 1,456 output
  Cache: 890 read / 234 written (78% hit rate)
  Duration: 3.2s
```

- **Quality**：最终得分与质量阈值的对比
- **Iterations**：优化迭代次数
- **Tokens**：API 令牌使用量
- **Cache**：提示缓存统计（仅限 Claude）
- **Duration**：总处理时间

## 下一步

- [配置您的项目](./configuration) 以获得最佳设置
- [设置术语表](./glossary) 确保术语一致性
- [了解质量控制](./quality-control) 和调优
- [优化成本](./cost-optimization) 适用于大型项目
- [使用 Ollama 本地运行](./ollama) 进行私密的离线翻译
