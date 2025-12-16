# Local Translation with Ollama

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

Run llm-translate completely offline using Ollama. No API keys required, complete privacy for sensitive documents.

::: warning Quality Varies by Model
Ollama translation quality is **highly dependent on model selection**. For reliable translation results:

- **Minimum**: 14B+ parameter models (e.g., `qwen2.5:14b`, `llama3.1:8b`)
- **Recommended**: 32B+ models (e.g., `qwen2.5:32b`, `llama3.3:70b`)
- **Not recommended**: Models under 7B produce inconsistent and often unusable translations

Smaller models (3B, 7B) may work for simple content but frequently fail on technical documentation, produce incomplete outputs, or ignore formatting instructions.
:::

## Why Ollama?

- **Privacy**: Documents never leave your machine
- **No API costs**: Unlimited translations after initial setup
- **Offline**: Works without internet connection
- **Customizable**: Fine-tune models for your domain

## System Requirements

### Minimum (14B models)

- **RAM**: 16GB (for 14B models like qwen2.5:14b)
- **Storage**: 20GB free space
- **CPU**: Modern multi-core processor

### Recommended

- **RAM**: 32GB+ (for larger models like qwen2.5:32b)
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
# Recommended: Qwen 2.5 14B (best multilingual support for local)
ollama pull qwen2.5:14b

# Alternative: Llama 3.2 (lighter, good for English-centric docs)
ollama pull llama3.2
```

### 3. Translate

```bash
# Basic translation with qwen2.5:14b
llm-translate file README.md -o README.ko.md -s en -t ko --provider ollama --model qwen2.5:14b

# With specific model
llm-translate file doc.md -s en -t ja --provider ollama --model qwen2.5:14b
```

::: tip Qwen 2.5 for Translation
Qwen 2.5 supports 29 languages including Korean, Japanese, Chinese, and all major European languages. The 14B version offers excellent quality for translation tasks while running on 16GB RAM.
:::

## Recommended Models for Translation

### Best Quality (32B+)

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
For local models, a lower `qualityThreshold` (75) is recommended to avoid excessive refinement iterations. Use 14B+ models for reliable results.
:::

### Model-Specific Settings

For different document types:

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

| Aspect | Cloud (Claude/OpenAI) | Local (Ollama) |
|--------|----------------------|----------------|
| **Privacy** | Data sent to servers | Fully private |
| **Cost** | Per-token pricing | Free after setup |
| **Quality** | Excellent | Good to Very Good (model dependent) |
| **Speed** | Fast | Varies with hardware |
| **Offline** | No | Yes |
| **Setup** | API key only | Install + download model |
| **Context** | 200K (Claude) | 32K-128K |

::: info Local Translation Considerations
Local models (14B+) can produce good translation results but may not match cloud API quality for complex or nuanced content. Use larger models (32B+) for better results.
:::

### When to Use Ollama

- Sensitive/confidential documents
- Air-gapped environments
- High-volume translation (cost savings)
- Privacy-conscious organizations
- Simple to moderate complexity documents

### When to Use Cloud APIs

- Need for prompt caching (Claude - 90% cost reduction)
- Limited local hardware (< 16GB RAM)
- Need highest quality translations
- Complex technical or legal documents
- Occasional/low-volume translation

## Advanced: Custom Models

### Creating a Translation-Optimized Model

Create a `Modelfile` based on Qwen:

```dockerfile
FROM qwen2.5:14b

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
llm-translate file doc.md -s en -t ko --provider ollama --model translator
```

## Next Steps

- [Configure glossaries](./glossary) for consistent terminology
- [Optimize chunking](./chunking) for your documents
- [Set up quality control](./quality-control) thresholds
