# 提供商

llm-translate 支持多个 LLM 提供商。每个都有不同的优势和劣势。

## 支持的提供商

| 提供商 | 缓存 | 最适合 | 设置难度 |
|----------|---------|----------|------------------|
| Claude | 完整 | 质量 + 成本 | 简单 |
| OpenAI | 自动 | 生态系统集成 | 简单 |
| Ollama | 无 | 隐私/离线 | 中等 |

## Claude（推荐）

### 为什么选择 Claude？

- **提示缓存**：成本降低高达 90%
- **高质量**：卓越的翻译准确性
- **长上下文**：200K token 上下文窗口
- **多个层级**：Haiku（快速）、Sonnet（均衡）、Opus（最佳）

### 设置

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 模型选择

```bash
# Fast and cheap (default)
llm-translate file doc.md --target ko --model claude-haiku-4-5-20251001

# Balanced quality/cost
llm-translate file doc.md --target ko --model claude-sonnet-4-5-20250929

# Highest quality
llm-translate file doc.md --target ko --model claude-opus-4-5-20251101
```

### 何时使用各个模型

| 模型 | 用例 |
|-------|----------|
| Haiku | README 文件、简单文档、高吞吐量 |
| Sonnet | 技术文档、API 参考 |
| Opus | 法律、营销、需要细致处理的内容 |

## OpenAI

### 设置

```bash
export OPENAI_API_KEY=sk-xxxxx
```

### 使用

```bash
llm-translate file doc.md --target ko --provider openai --model gpt-4o
```

### 可用模型

| 模型 | 速度 | 质量 | 成本 |
|-------|-------|---------|------|
| gpt-4o-mini | 快速 | 良好 | 极低 |
| gpt-4o | 中等 | 优秀 | 中等 |
| gpt-4-turbo | 中等 | 优秀 | 高 |

### 何时使用

- 已在其他服务中使用 OpenAI
- 需要特定的 OpenAI 功能
- 更喜欢 Azure OpenAI（设置自定义 baseUrl）

## Ollama

本地自托管 LLM，用于隐私或离线使用。

### 设置

1. 安装 Ollama：

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

2. 拉取模型：

```bash
ollama pull llama3.1
```

3. 启动服务器：

```bash
ollama serve
```

### 使用

```bash
export OLLAMA_BASE_URL=http://localhost:11434

llm-translate file doc.md --target ko --provider ollama --model llama3.1
```

### 推荐模型

| 模型 | 模型大小 | 质量 | 速度 |
|-------|-----------|---------|-------|
| llama3.1 | 8B | 良好 | 快速 |
| llama3.1:70b | 70B | 优秀 | 缓慢 |
| mistral | 7B | 良好 | 快速 |
| mixtral | 8x7B | 非常好 | 中等 |

### 限制

- 无提示缓存（大型文档成本更高）
- 质量取决于模型
- 需要本地 GPU 以获得良好性能
- 某些模型的语言支持有限

### 何时使用

- 敏感/私密文档
- 离线环境
- 降低成本（无 API 费用）
- 测试和实验

## 提供商比较

### 质量

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Llama3.1
```

### 成本（每 100 万 token）

```
Ollama ($0) < Haiku ($1) < GPT-4o-mini ($0.15) < Sonnet ($3) < GPT-4o ($2.5) < Opus ($15)
```

### 速度

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies)
```

## 切换提供商

### CLI

```bash
# Different providers
llm-translate file doc.md --target ko --provider claude
llm-translate file doc.md --target ko --provider openai
llm-translate file doc.md --target ko --provider ollama
```

### 配置文件

```json
{
  "provider": {
    "name": "openai",
    "model": "gpt-4o"
  }
}
```

### 编程方式

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

## 故障转移配置

配置备用提供商以提高可靠性：

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

## 自定义端点

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

### 自托管

```json
{
  "provider": {
    "name": "ollama",
    "baseUrl": "https://your-server.com:11434"
  }
}
```
