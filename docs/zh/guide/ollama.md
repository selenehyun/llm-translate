# 使用 Ollama 进行本地翻译

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

使用 Ollama 完全离线运行 llm-translate。无需 API 密钥，敏感文档完全隐私保护。

::: warning 质量因模型而异
Ollama 翻译质量**高度依赖于模型选择**。为获得可靠的翻译结果：

- **最低要求**：14B+ 参数模型（例如 `qwen2.5:14b` 、 `llama3.1:8b`）
- **推荐**：32B+ 模型（例如 `qwen2.5:32b` 、 `llama3.3:70b`）
- **不推荐**：7B 以下的模型会产生不一致且通常无法使用的翻译

较小的模型（3B、7B）可能适用于简单内容，但在技术文档上经常失败，产生不完整的输出，或忽略格式指令。
:::

## 为什么选择 Ollama？

- **隐私保护**：文档永不离开您的设备
- **无 API 成本**：初始设置后可无限翻译
- **离线工作**：无需互联网连接
- **可定制**：为您的领域微调模型

## 系统要求

### 最低要求（14B 模型）

- **内存**：16GB（适用于 qwen2.5:14b 等 14B 模型）
- **存储**：20GB 可用空间
- **CPU**：现代多核处理器

### 推荐配置

- **内存**：32GB+（适用于 qwen2.5:32b 等大型模型）
- **GPU**：NVIDIA 16GB+ 显存或 Apple Silicon（M2/M3/M4）
- **存储**：100GB+ 用于多个模型

### GPU 支持

| 平台 | GPU | 支持程度 |
|----------|-----|---------|
| macOS | Apple Silicon (M1/M2/M3/M4) | 优秀 |
| Linux | NVIDIA (CUDA) | 优秀 |
| Linux | AMD (ROCm) | 良好 |
| Windows | NVIDIA (CUDA) | 良好 |
| Windows | AMD | 有限 |

## 安装

### macOS

```bash
# Using Homebrew (recommended)
brew install ollama

# Or download from https://ollama.ai
```

### Linux

```bash
# One-line installer
curl -fsSL https://ollama.ai/install.sh | sh

# Or using package managers
# Ubuntu/Debian
curl -fsSL https://ollama.ai/install.sh | sh

# Arch Linux
yay -S ollama
```

### Windows

从 [ollama.ai](https://ollama.ai/download/windows) 下载安装程序。

### Docker

```bash
# CPU only
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# With NVIDIA GPU
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

## 快速开始

### 1. 启动 Ollama 服务器

```bash
# Start the server (runs in background)
ollama serve
```

::: tip
在 macOS 和 Windows 上，Ollama 在安装后会自动作为后台服务启动。
:::

### 2. 下载模型

```bash
# Recommended: Qwen 2.5 14B (best multilingual support for local)
ollama pull qwen2.5:14b

# Alternative: Llama 3.2 (lighter, good for English-centric docs)
ollama pull llama3.2
```

### 3. 翻译

```bash
# Basic translation with qwen2.5:14b
llm-translate file README.md -o README.ko.md -s en -t ko --provider ollama --model qwen2.5:14b

# With specific model
llm-translate file doc.md -s en -t ja --provider ollama --model qwen2.5:14b
```

::: tip Qwen 2.5 翻译优势
Qwen 2.5 支持 29 种语言，包括韩语、日语、中文和所有主要欧洲语言。14B 版本在 16GB 内存上运行时为翻译任务提供优秀的质量。
:::

## 推荐的翻译模型

### 最佳质量（32B+）

| 模型 | 大小 | 显存 | 语言 | 质量 |
|-------|------|------|-----------|---------|
|`llama3.3`| 70B | 40GB+ | 100+ | 优秀 |
|`qwen2.5:32b`| 32B | 20GB+ | 29 | 优秀 |
|`llama3.1:70b`| 70B | 40GB+ | 8 | 很好 |

### 轻量级且语言支持最佳

对于资源有限的系统，**Qwen2.5** 提供最佳的多语言支持（29 种语言）。

| 模型 | 参数 | 内存 | 语言 | 质量 | 最适合 |
|-------|-----------|-----|-----------|---------|----------|
|`qwen2.5:3b`| 3B | 3GB | 29 | 良好 | **平衡（推荐）** |
|`qwen2.5:7b`| 7B | 6GB | 29 | 很好 | 质量优先 |
|`gemma3:4b`| 4B | 4GB | 多种 | 良好 | 翻译优化 |
|`llama3.2`| 3B | 4GB | 8 | 良好 | 英文为主的文档 |

### 超轻量级（< 2GB 内存）

| 模型 | 参数 | 内存 | 语言 | 质量 |
|-------|-----------|-----|-----------|---------|
|`qwen2.5:1.5b`| 1.5B | 2GB | 29 | 基础 |
|`qwen2.5:0.5b`| 0.5B | 1GB | 29 | 基础 |
|`gemma3:1b`| 1B | 1.5GB | 多种 | 基础 |
|`llama3.2:1b`| 1B | 2GB | 8 | 基础 |

::: tip Qwen 多语言支持
Qwen2.5 支持包括韩语、日语、中文和所有主要欧洲语言在内的 29 种语言。对于非英语翻译工作，Qwen 通常是最佳的轻量级选择。
:::

### 下载模型

```bash
# List available models
ollama list

# Recommended for translation (14B+)
ollama pull qwen2.5:14b   # Best multilingual (29 languages)
ollama pull qwen2.5:32b   # Higher quality, needs 32GB RAM
ollama pull llama3.1:8b   # Good quality, lighter

# Lightweight options (may have quality issues)
ollama pull qwen2.5:7b    # Better quality than 3B
ollama pull llama3.2      # Good for English-centric docs

# Other options
ollama pull mistral-nemo
```

## 配置

### 环境变量

```bash
# Default server URL (optional, this is the default)
export OLLAMA_BASE_URL=http://localhost:11434

# Custom server location
export OLLAMA_BASE_URL=http://192.168.1.100:11434
```

### 配置文件

```json
{
  "provider": {
    "name": "ollama",
    "model": "qwen2.5:14b",
    "baseUrl": "http://localhost:11434"
  },
  "translation": {
    "qualityThreshold": 75,
    "maxIterations": 3
  }
}
```

::: tip
对于本地模型，建议使用较低的 `qualityThreshold`(75) 以避免过度的精化迭代。使用 14B+ 模型以获得可靠的结果。
:::

### 模型特定设置

针对不同文档类型：

```bash
# Best quality - qwen2.5:14b (recommended for most use cases)
llm-translate file api-spec.md -s en -t ko \
  --provider ollama \
  --model qwen2.5:14b \
  --quality 75

# Higher quality with 32B model (requires 32GB RAM)
llm-translate file legal-doc.md -s en -t ko \
  --provider ollama \
  --model qwen2.5:32b \
  --quality 80

# README files - lighter model for simple content
llm-translate file README.md -s en -t ko \
  --provider ollama \
  --model llama3.2 \
  --quality 70

# Large documentation sets - balance speed and quality
llm-translate dir ./docs ./docs-ko -s en -t ko \
  --provider ollama \
  --model qwen2.5:14b \
  --parallel 2
```

## 性能优化

### GPU 加速

#### NVIDIA (Linux/Windows)

```bash
# Check CUDA availability
nvidia-smi

# Ollama automatically uses CUDA if available
ollama serve
```

#### Apple Silicon (macOS)

Metal 加速在 M1/M2/M3/M4 Mac 上自动启用。

```bash
# Check GPU usage
sudo powermetrics --samplers gpu_power
```

### 内存管理

```bash
# Set GPU memory limit (Linux with NVIDIA)
CUDA_VISIBLE_DEVICES=0 ollama serve

# Limit CPU threads
OLLAMA_NUM_PARALLEL=2 ollama serve
```

### 大文档优化

```bash
# Reduce chunk size for memory-constrained systems
llm-translate file large-doc.md --target ko \
  --provider ollama \
  --chunk-size 512

# Disable caching to reduce memory usage
llm-translate file doc.md --target ko \
  --provider ollama \
  --no-cache

# Single-threaded processing for stability
llm-translate dir ./docs ./docs-ko --target ko \
  --provider ollama \
  --parallel 1
```

## 远程 Ollama 服务器

### 服务器设置

在服务器机器上：

```bash
# Allow external connections
OLLAMA_HOST=0.0.0.0 ollama serve
```

::: warning 安全提醒
仅在受信任的网络上暴露 Ollama。考虑使用 VPN 或 SSH 隧道进行远程访问。
:::

### SSH 隧道（推荐）

```bash
# Create secure tunnel to remote server
ssh -L 11434:localhost:11434 user@remote-server

# Then use as normal
llm-translate file doc.md --target ko --provider ollama
```

### 直接连接

```bash
# Set remote server URL
export OLLAMA_BASE_URL=http://remote-server:11434

llm-translate file doc.md --target ko --provider ollama
```

### 团队服务器的 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  ollama_data:
```

## 故障排除

### 连接错误

```
Error: Cannot connect to Ollama server at http://localhost:11434
```

**解决方案：**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start the server
ollama serve

# Check for port conflicts
lsof -i :11434
```

### 模型未找到

```
Error: Model "llama3.2" not found. Pull it with: ollama pull llama3.2
```

**解决方案：**

```bash
# Download the model
ollama pull llama3.2

# Verify installation
ollama list
```

### 内存不足

```
Error: Out of memory. Try a smaller model or reduce chunk size.
```

**解决方案：**

```bash
# Use a smaller model
ollama pull llama3.2:1b
llm-translate file doc.md --target ko --provider ollama --model llama3.2:1b

# Reduce chunk size
llm-translate file doc.md --target ko --provider ollama --chunk-size 256

# Close other applications to free RAM
```

### 性能缓慢

**解决方案：**
