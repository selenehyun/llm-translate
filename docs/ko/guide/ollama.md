# Ollama를 사용한 로컬 번역

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

Ollama를 사용하여 llm-translate를 완전히 오프라인으로 실행합니다. API 키가 필요하지 않으며, 민감한 문서에 대한 완전한 프라이버시를 제공합니다.

::: warning 모델에 따라 품질이 달라집니다
Ollama 번역 품질은 **모델 선택에 크게 의존합니다**. 신뢰할 수 있는 번역 결과를 위해서는:

- **최소**: 14B+ 매개변수 모델 (예:`qwen2.5:14b `,` llama3.1:8b`)
- **권장**: 32B+ 모델 (예:`qwen2.5:32b `,` llama3.3:70b`)
- **권장하지 않음**: 7B 미만 모델은 일관성이 없고 종종 사용할 수 없는 번역을 생성합니다

작은 모델(3B, 7B)은 간단한 콘텐츠에서는 작동할 수 있지만 기술 문서에서는 자주 실패하고, 불완전한 출력을 생성하거나, 형식 지침을 무시합니다.
:::

## Ollama를 사용하는 이유는?

- **프라이버시**: 문서가 컴퓨터를 떠나지 않습니다
- **API 비용 없음**: 초기 설정 후 무제한 번역
- **오프라인**: 인터넷 연결 없이 작동
- **사용자 정의 가능**: 도메인에 맞게 모델 미세 조정

## 시스템 요구사항

### 최소 요구사항 (14B 모델)

- **RAM**: 16GB (qwen2.5:14b와 같은 14B 모델용)
- **저장공간**: 20GB 여유 공간
- **CPU**: 최신 멀티코어 프로세서

### 권장 사양

- **RAM**: 32GB+ (qwen2.5:32b와 같은 대형 모델용)
- **GPU**: 16GB+ VRAM을 가진 NVIDIA 또는 Apple Silicon (M2/M3/M4)
- **저장공간**: 여러 모델을 위한 100GB+

### GPU 지원

| 플랫폼 | GPU | 지원 |
|----------|-----|---------|
| macOS | Apple Silicon (M1/M2/M3/M4) | 우수 |
| Linux | NVIDIA (CUDA) | 우수 |
| Linux | AMD (ROCm) | 양호 |
| Windows | NVIDIA (CUDA) | 양호 |
| Windows | AMD | 제한적 |

## 설치

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

[ollama.ai](https://ollama.ai/download/windows)에서 설치 프로그램을 다운로드하세요.

### Docker

```bash
# CPU only
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# With NVIDIA GPU
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

## 빠른 시작

### 1. Ollama 서버 시작

```bash
# Start the server (runs in background)
ollama serve
```

::: tip
macOS와 Windows에서는 설치 후 Ollama가 백그라운드 서비스로 자동 시작됩니다.
:::

### 2. 모델 다운로드

```bash
# Recommended: Qwen 2.5 14B (best multilingual support for local)
ollama pull qwen2.5:14b

# Alternative: Llama 3.2 (lighter, good for English-centric docs)
ollama pull llama3.2
```

### 3. 번역

```bash
# Basic translation with qwen2.5:14b
llm-translate file README.md -o README.ko.md -s en -t ko --provider ollama --model qwen2.5:14b

# With specific model
llm-translate file doc.md -s en -t ja --provider ollama --model qwen2.5:14b
```

::: tip 번역을 위한 Qwen 2.5
Qwen 2.5는 한국어, 일본어, 중국어 및 모든 주요 유럽 언어를 포함한 29개 언어를 지원합니다. 14B 버전은 16GB RAM에서 실행되면서 번역 작업에 우수한 품질을 제공합니다.
:::

## 번역을 위한 권장 모델

### 최고 품질 (32B+)

| 모델 | 크기 | VRAM | 언어 | 품질 |
|-------|------|------|-----------|---------|
|`llama3.3`| 70B | 40GB+ | 100+ | 우수 |
|`qwen2.5:32b`| 32B | 20GB+ | 29 | 우수 |
|`llama3.1:70b`| 70B | 40GB+ | 8 | 매우 좋음 |

### 최고의 언어 지원을 가진 경량 모델

제한된 리소스를 가진 시스템의 경우, **Qwen2.5**가 최고의 다국어 지원(29개 언어)을 제공합니다.

| 모델 | 매개변수 | RAM | 언어 | 품질 | 최적 용도 |
|-------|-----------|-----|-----------|---------|----------|
|`qwen2.5:3b`| 3B | 3GB | 29 | 좋음 | **균형잡힌 (권장)** |
|`qwen2.5:7b`| 7B | 6GB | 29 | 매우 좋음 | 품질 우선 |
|`gemma3:4b`| 4B | 4GB | 다수 | 좋음 | 번역 최적화 |
|`llama3.2`| 3B | 4GB | 8 | 좋음 | 영어 중심 문서 |

### 초경량 (< 2GB RAM)

| 모델 | 매개변수 | RAM | 언어 | 품질 |
|-------|-----------|-----|-----------|---------|
|`qwen2.5:1.5b`| 1.5B | 2GB | 29 | 기본 |
|`qwen2.5:0.5b`| 0.5B | 1GB | 29 | 기본 |
|`gemma3:1b`| 1B | 1.5GB | 다수 | 기본 |
|`llama3.2:1b`| 1B | 2GB | 8 | 기본 |

::: tip 다국어를 위한 Qwen
Qwen2.5는 한국어, 일본어, 중국어 및 모든 주요 유럽 언어를 포함하여 29개 언어를 지원합니다. 영어가 아닌 번역 작업의 경우, Qwen이 종종 최고의 경량 선택입니다.
:::

### 모델 다운로드

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

## 구성

### 환경 변수

```bash
# Default server URL (optional, this is the default)
export OLLAMA_BASE_URL=http://localhost:11434

# Custom server location
export OLLAMA_BASE_URL=http://192.168.1.100:11434
```

### 구성 파일

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
로컬 모델의 경우, 과도한 개선 반복을 피하기 위해 더 낮은 `qualityThreshold`(75)를 권장합니다. 안정적인 결과를 위해서는 14B+ 모델을 사용하세요.
:::

### 모델별 설정

다양한 문서 유형에 대해:

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

## 성능 최적화

### GPU 가속

#### NVIDIA (Linux/Windows)

```bash
# Check CUDA availability
nvidia-smi

# Ollama automatically uses CUDA if available
ollama serve
```

#### Apple Silicon (macOS)

Metal 가속은 M1/M2/M3/M4 Mac에서 자동으로 적용됩니다.

```bash
# Check GPU usage
sudo powermetrics --samplers gpu_power
```

### 메모리 관리

```bash
# Set GPU memory limit (Linux with NVIDIA)
CUDA_VISIBLE_DEVICES=0 ollama serve

# Limit CPU threads
OLLAMA_NUM_PARALLEL=2 ollama serve
```

### 대용량 문서 최적화

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

## 원격 Ollama 서버

### 서버 설정

서버 머신에서:

```bash
# Allow external connections
OLLAMA_HOST=0.0.0.0 ollama serve
```

::: warning 보안
신뢰할 수 있는 네트워크에서만 Ollama를 노출하세요. 원격 접근을 위해서는 VPN 또는 SSH 터널 사용을 고려하세요.
:::

### SSH 터널 (권장)

```bash
# Create secure tunnel to remote server
ssh -L 11434:localhost:11434 user@remote-server

# Then use as normal
llm-translate file doc.md --target ko --provider ollama
```

### 직접 연결

```bash
# Set remote server URL
export OLLAMA_BASE_URL=http://remote-server:11434

llm-translate file doc.md --target ko --provider ollama
```

### 팀 서버용 Docker Compose

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

## 문제 해결

### 연결 오류

```
Error: Cannot connect to Ollama server at http://localhost:11434
```

**해결책:**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start the server
ollama serve

# Check for port conflicts
lsof -i :11434
```

### 모델을 찾을 수 없음

```
Error: Model "llama3.2" not found. Pull it with: ollama pull llama3.2
```

**해결책:**

```bash
# Download the model
ollama pull llama3.2

# Verify installation
ollama list
```

### 메모리 부족

```
Error: Out of memory. Try a smaller model or reduce chunk size.
```

**해결책:**

```bash
# Use a smaller model
ollama pull llama3.2:1b
llm-translate file doc.md --target ko --provider ollama --model llama3.2:1b

# Reduce chunk size
llm-translate file doc.md --target ko --provider ollama --chunk-size 256

# Close other applications to free RAM
```

### 느린 성능

**해결책:**
