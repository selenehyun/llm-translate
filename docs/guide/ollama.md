# Local Translation with Ollama

Run llm-translate completely offline using Ollama. No API keys required, complete privacy for sensitive documents.

## Why Ollama?

- **Privacy**: Documents never leave your machine
- **No API costs**: Unlimited translations after initial setup
- **Offline**: Works without internet connection
- **Customizable**: Fine-tune models for your domain

## System Requirements

### Minimum (GPT-OSS 20B)

- **RAM**: 16GB (for GPT-OSS 20B)
- **Storage**: 20GB free space
- **CPU**: Modern multi-core processor

### Recommended

- **RAM**: 32GB+ (for larger models like GPT-OSS 120B)
- **GPU**: NVIDIA with 16GB+ VRAM or Apple Silicon (M2/M3/M4)
- **Storage**: 100GB+ for multiple models

### GPU Support

| Platform | GPU | Support |
|----------|-----|---------|
| macOS | Apple Silicon (M1/M2/M3/M4) | Excellent |
| Linux | NVIDIA (CUDA) | Excellent |
| Linux | AMD (ROCm) | Good |
| Windows | NVIDIA (CUDA) | Good |
| Windows | AMD | Limited |

## Installation

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

Download the installer from [ollama.ai](https://ollama.ai/download/windows).

### Docker

```bash
# CPU only
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# With NVIDIA GPU
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

## Quick Start

### 1. Start Ollama Server

```bash
# Start the server (runs in background)
ollama serve
```

::: tip
On macOS and Windows, Ollama starts automatically as a background service after installation.
:::

### 2. Download a Model

```bash
# Recommended: OpenAI's GPT-OSS 20B (best quality for local)
ollama pull gpt-oss:20b

# Alternative: Llama 3.2 (lighter, good multilingual support)
ollama pull llama3.2
```

### 3. Translate

```bash
# Basic translation with GPT-OSS 20B
llm-translate file README.md -o README.ko.md --target ko --provider ollama

# With specific model
llm-translate file doc.md --target ja --provider ollama --model gpt-oss:20b
```

::: tip GPT-OSS 20B
OpenAI's first open-weight model since GPT-2. It offers excellent quality with full chain-of-thought visibility, function calling, and runs on 16GB RAM. [Learn more](https://github.com/openai/gpt-oss)
:::

## Recommended Models for Translation

### GPT-OSS (Recommended)

OpenAI's open-weight models, offering the best quality for local translation.

| Model | Parameters | Download | RAM | Context | Quality |
|-------|-----------|----------|-----|---------|---------|
| `gpt-oss:20b` | 21B (3.6B active) | 14GB | 16GB | 128K | Excellent |
| `gpt-oss:120b` | 117B (5.1B active) | 65GB | 80GB | 128K | Outstanding |

**Key Features:**
- Full chain-of-thought visibility for debugging
- Configurable reasoning effort (low/medium/high)
- Native function calling and tool support
- Apache 2.0 license (commercial use OK)
- MXFP4 quantization for efficient memory usage

### Best Quality (Other Options)

| Model | Size | VRAM | Languages | Quality |
|-------|------|------|-----------|---------|
| `llama3.3` | 70B | 40GB+ | 100+ | Excellent |
| `qwen2.5:32b` | 32B | 20GB+ | 29 | Excellent |
| `llama3.1:70b` | 70B | 40GB+ | 8 | Very Good |

### Lightweight with Best Language Support

For systems with limited resources, **Qwen2.5** offers the best multilingual support (29 languages).

| Model | Parameters | RAM | Languages | Quality | Best For |
|-------|-----------|-----|-----------|---------|----------|
| `qwen2.5:3b` | 3B | 3GB | 29 | Good | **Balanced (recommended)** |
| `qwen2.5:7b` | 7B | 6GB | 29 | Very Good | Quality priority |
| `gemma3:4b` | 4B | 4GB | Many | Good | Translation-optimized |
| `llama3.2` | 3B | 4GB | 8 | Good | English-centric docs |

### Ultra-Lightweight (< 2GB RAM)

| Model | Parameters | RAM | Languages | Quality |
|-------|-----------|-----|-----------|---------|
| `qwen2.5:1.5b` | 1.5B | 2GB | 29 | Basic |
| `qwen2.5:0.5b` | 0.5B | 1GB | 29 | Basic |
| `gemma3:1b` | 1B | 1.5GB | Many | Basic |
| `llama3.2:1b` | 1B | 2GB | 8 | Basic |

::: tip Qwen for Multilingual
Qwen2.5 supports 29 languages including Korean, Japanese, Chinese, and all major European languages. For non-English translation work, Qwen is often the best lightweight choice.
:::

### Downloading Models

```bash
# List available models
ollama list

# GPT-OSS (best quality)
ollama pull gpt-oss:20b
ollama pull gpt-oss:120b  # if you have 80GB+ VRAM

# Lightweight with best language support
ollama pull qwen2.5:3b    # balanced (recommended for low-resource)
ollama pull qwen2.5:7b    # better quality
ollama pull gemma3:4b     # translation-optimized

# Ultra-lightweight
ollama pull qwen2.5:1.5b  # 2GB RAM
ollama pull qwen2.5:0.5b  # 1GB RAM

# Other options
ollama pull llama3.2
ollama pull mistral-nemo
```

## Configuration

### Environment Variables

```bash
# Default server URL (optional, this is the default)
export OLLAMA_BASE_URL=http://localhost:11434

# Custom server location
export OLLAMA_BASE_URL=http://192.168.1.100:11434
```

### Config File

```json
{
  "provider": {
    "name": "ollama",
    "model": "gpt-oss:20b",
    "baseUrl": "http://localhost:11434"
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 3
  }
}
```

::: tip
GPT-OSS 20B achieves quality comparable to cloud APIs, so you can use higher `qualityThreshold` (85) compared to other local models.
:::

### Model-Specific Settings

For different document types:

```bash
# Best quality - GPT-OSS 20B (recommended for most use cases)
llm-translate file api-spec.md --target ko \
  --provider ollama \
  --model gpt-oss:20b \
  --quality 85

# Enterprise/Critical docs - GPT-OSS 120B (requires 80GB VRAM)
llm-translate file legal-doc.md --target ko \
  --provider ollama \
  --model gpt-oss:120b \
  --quality 90

# README files - lighter model for simple content
llm-translate file README.md --target ko \
  --provider ollama \
  --model llama3.2 \
  --quality 75

# Large documentation sets - balance speed and quality
llm-translate dir ./docs ./docs-ko --target ko \
  --provider ollama \
  --model gpt-oss:20b \
  --parallel 2
```

## Performance Optimization

### GPU Acceleration

#### NVIDIA (Linux/Windows)

```bash
# Check CUDA availability
nvidia-smi

# Ollama automatically uses CUDA if available
ollama serve
```

#### Apple Silicon (macOS)

Metal acceleration is automatic on M1/M2/M3/M4 Macs.

```bash
# Check GPU usage
sudo powermetrics --samplers gpu_power
```

### Memory Management

```bash
# Set GPU memory limit (Linux with NVIDIA)
CUDA_VISIBLE_DEVICES=0 ollama serve

# Limit CPU threads
OLLAMA_NUM_PARALLEL=2 ollama serve
```

### Optimizing for Large Documents

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

## Remote Ollama Server

### Server Setup

On the server machine:

```bash
# Allow external connections
OLLAMA_HOST=0.0.0.0 ollama serve
```

::: warning Security
Only expose Ollama on trusted networks. Consider using a VPN or SSH tunnel for remote access.
:::

### SSH Tunnel (Recommended)

```bash
# Create secure tunnel to remote server
ssh -L 11434:localhost:11434 user@remote-server

# Then use as normal
llm-translate file doc.md --target ko --provider ollama
```

### Direct Connection

```bash
# Set remote server URL
export OLLAMA_BASE_URL=http://remote-server:11434

llm-translate file doc.md --target ko --provider ollama
```

### Docker Compose for Team Server

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

## Troubleshooting

### Connection Errors

```
Error: Cannot connect to Ollama server at http://localhost:11434
```

**Solutions:**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start the server
ollama serve

# Check for port conflicts
lsof -i :11434
```

### Model Not Found

```
Error: Model "llama3.2" not found. Pull it with: ollama pull llama3.2
```

**Solution:**

```bash
# Download the model
ollama pull llama3.2

# Verify installation
ollama list
```

### Out of Memory

```
Error: Out of memory. Try a smaller model or reduce chunk size.
```

**Solutions:**

```bash
# Use a smaller model
ollama pull llama3.2:1b
llm-translate file doc.md --target ko --provider ollama --model llama3.2:1b

# Reduce chunk size
llm-translate file doc.md --target ko --provider ollama --chunk-size 256

# Close other applications to free RAM
```

### Slow Performance

**Solutions:**

1. **Use GPU acceleration** - Ensure Ollama detects your GPU
2. **Use smaller model** - 7B models are much faster than 70B
3. **Reduce quality threshold** - Fewer refinement iterations
4. **Increase chunk size** - Fewer API calls (if memory allows)

```bash
# Check if GPU is being used
ollama run llama3.2 --verbose

# Fast translation settings
llm-translate file doc.md --target ko \
  --provider ollama \
  --model llama3.2 \
  --quality 70 \
  --max-iterations 2
```

### Quality Issues

Local models may produce lower quality than cloud APIs. Tips to improve:

1. **Use larger models** when possible
2. **Use models with good multilingual training** (Qwen, Llama 3.2+)
3. **Provide glossary** for technical terms
4. **Lower quality threshold** to avoid infinite refinement loops

```bash
# High-quality local translation
llm-translate file doc.md --target ko \
  --provider ollama \
  --model qwen2.5:32b \
  --glossary glossary.json \
  --quality 80 \
  --max-iterations 4
```

## Comparison: Cloud vs Local

| Aspect | Cloud (Claude/OpenAI) | Local (GPT-OSS 20B) |
|--------|----------------------|---------------------|
| **Privacy** | Data sent to servers | Fully private |
| **Cost** | Per-token pricing | Free after setup |
| **Quality** | Excellent | Excellent (comparable) |
| **Speed** | Fast | Fast with GPU |
| **Offline** | No | Yes |
| **Setup** | API key only | Install + download model |
| **Context** | 200K (Claude) | 128K |

::: info GPT-OSS Advantage
With GPT-OSS 20B, the quality gap between cloud and local translation has significantly narrowed. For most documents, you can expect results comparable to GPT-4o while keeping data completely private.
:::

### When to Use Ollama + GPT-OSS

- Sensitive/confidential documents
- Air-gapped environments
- High-volume translation (cost savings)
- Privacy-conscious organizations
- When you need chain-of-thought visibility

### When to Use Cloud APIs

- Need for prompt caching (Claude - 90% cost reduction)
- Limited local hardware (< 16GB RAM)
- Need 200K+ context window
- Occasional/low-volume translation

## Advanced: Custom Models

### Creating a Translation-Optimized Model

Create a `Modelfile` based on GPT-OSS:

```dockerfile
FROM gpt-oss:20b

PARAMETER temperature 0.3
PARAMETER num_ctx 32768

SYSTEM """You are a professional translator. Follow these rules:
1. Maintain the original formatting (markdown, code blocks)
2. Never translate code inside code blocks
3. Keep URLs and file paths unchanged
4. Translate naturally, not literally
5. Use formal/polite register for Korean (경어체) and Japanese (です・ます調)
"""
```

Build and use:

```bash
# Create custom model
ollama create translator -f Modelfile

# Use for translation
llm-translate file doc.md --target ko --provider ollama --model translator
```

### Adjusting Reasoning Effort

GPT-OSS supports configurable reasoning effort. For translation tasks:

```bash
# Default reasoning (balanced)
ollama run gpt-oss:20b

# Lower effort for faster simple translations
# (set via environment or API parameters)
```

## Next Steps

- [Configure glossaries](./glossary) for consistent terminology
- [Optimize chunking](./chunking) for your documents
- [Set up quality control](./quality-control) thresholds
