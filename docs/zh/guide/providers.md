# 提供商

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

llm-translate 支持多个 LLM 提供商。每个提供商都有不同的优势和权衡。

## 支持的提供商

| 提供商 | 缓存 | 最适用于 | 设置复杂度 |
|----------|---------|----------|------------------|
| Claude | 完整 | 质量 + 成本 | 简单 |
| OpenAI | 自动 | 生态系统 | 简单 |
| Ollama | 无 | 隐私/离线 | 中等 |

## Claude（推荐）

### 为什么选择 Claude？

- **提示缓存**：成本降低高达 90%
- **高质量**：出色的翻译准确性
- **长上下文**：200K 令牌上下文窗口
- **多层级**：Haiku（快速）、Sonnet（平衡）、Opus（最佳）

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

| 模型 | 使用场景 |
|-------|----------|
| Haiku | README 文件、简单文档、大批量 |
| Sonnet | 技术文档、API 参考 |
| Opus | 法律、营销、细致入微的内容 |

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
| gpt-4o-mini | 快 | 良好 | 很低 |
| gpt-4o | 中等 | 优秀 | 中等 |
| gpt-4-turbo | 中等 | 优秀 | 高 |

### 何时使用

- 已经在其他服务中使用 OpenAI
- 需要特定的 OpenAI 功能
- 偏好 Azure OpenAI（设置自定义 baseUrl）

## Ollama

用于隐私或离线使用的本地自托管 LLM。无需 API 密钥。

::: warning 质量因模型而异
Ollama 翻译质量**高度依赖于模型选择**。为获得可靠的翻译结果：

- **最低要求**：14B+ 参数模型（例如 `qwen2.5:14b` 、 `llama3.1:14b`）
- **推荐**：32B+ 模型（例如 `qwen2.5:32b` 、 `llama3.3:70b`）
- **不推荐**：7B 以下的模型会产生不一致且通常无法使用的翻译

较小的模型（3B、7B）可能适用于简单内容，但在技术文档上经常失败，产生不完整的输出，或忽略格式指令。
:::

### 快速设置

```bash
# 1. Install (macOS)
brew install ollama

# 2. Pull qwen2.5:14b (recommended)
ollama pull qwen2.5:14b

# 3. Translate
llm-translate file doc.md -s en -t ko --provider ollama --model qwen2.5:14b
```

### 推荐模型

| 模型 | 内存 | 质量 | 最适用于 |
|-------|-----|---------|----------|
|`qwen2.5:14b`| 16GB | 很好 | **最佳平衡（推荐）** |
|`qwen2.5:32b`| 32GB | 优秀 | 更高质量 |
|`llama3.1:8b`| 8GB | 良好 | 轻量级 |
|`llama3.2`| 4GB | 一般 | 仅限简单内容 |

### 何时使用

- 敏感/私密文档
- 离线环境
- 成本优化（无 API 费用）
- 简单到中等复杂度的内容

::: tip 完整指南
查看[使用 Ollama 进行本地翻译](./ollama)获取完整的设置说明、GPU 优化、故障排除和高级配置。
:::

## 提供商比较

### 质量

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Qwen2.5:32b > Qwen2.5:14b
```

### 成本（每 100 万令牌）

```
Ollama ($0) < GPT-4o-mini ($0.15) < Haiku ($1) < GPT-4o ($2.5) < Sonnet ($3) < Opus ($15)
```

### 速度

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies with hardware)
```

## 切换提供商

### CLI

```bash
# Different providers
llm-translate file doc.md -s en -t ko --provider claude
llm-translate file doc.md -s en -t ko --provider openai
llm-translate file doc.md -s en -t ko --provider ollama
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

## 回退配置

配置回退提供商以提高可靠性：

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
