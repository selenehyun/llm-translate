# serve

Start the translation API server for containerized deployment.

## Usage

```bash
llm-translate serve [options]
```

## Description

The `serve` command starts an HTTP server that exposes the translation engine as a REST API. This is ideal for:

- Containerized deployments (Docker, Kubernetes)
- Microservice architectures
- Building translation services

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <number>` | Server port | `3000` (or `TRANSLATE_PORT` env) |
| `-H, --host <string>` | Host to bind | `0.0.0.0` |
| `--no-auth` | Disable API key authentication | `false` |
| `--cors` | Enable CORS for browser clients | `false` |
| `--json` | Use JSON logging format (for containers) | `false` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TRANSLATE_PORT` | Server port (overridden by `--port`) |
| `TRANSLATE_API_KEY` | API key for authentication |
| `ANTHROPIC_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OLLAMA_BASE_URL` | Ollama server URL |

## API Endpoints

### POST /translate

Main translation endpoint.

**Request Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key
```

Or use Bearer token:
```
Authorization: Bearer your-api-key
```

**Request Body:**
```json
{
  "content": "Hello, world!",
  "sourceLang": "en",
  "targetLang": "ko",
  "format": "text",
  "mode": "balanced",
  "glossary": [
    { "source": "API", "target": "API", "doNotTranslate": true }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Text to translate |
| `sourceLang` | string | Yes | Source language code |
| `targetLang` | string | Yes | Target language code |
| `format` | string | No | `markdown`, `html`, or `text` (default) |
| `mode` | string | No | `fast`, `balanced` (default), or `quality` |
| `glossary` | array | No | Inline glossary terms |
| `provider` | string | No | `claude`, `openai`, or `ollama` |
| `model` | string | No | Model name |
| `qualityThreshold` | number | No | Quality threshold (0-100) |
| `maxIterations` | number | No | Max refinement iterations (1-10) |
| `context` | string | No | Additional context for translation |

**Response:**
```json
{
  "translated": "안녕하세요, 세계!",
  "quality": 92,
  "iterations": 2,
  "tokensUsed": {
    "input": 156,
    "output": 48
  },
  "duration": 2341,
  "provider": "claude",
  "model": "claude-sonnet-4-20250514"
}
```

### GET /health

Health check endpoint for container orchestration.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "uptime": 3600,
  "providers": [
    { "name": "claude", "available": true },
    { "name": "openai", "available": false },
    { "name": "ollama", "available": true }
  ]
}
```

### GET /health/live

Simple liveness probe.

```json
{ "status": "ok" }
```

### GET /health/ready

Readiness probe. Returns 503 if no providers are configured.

```json
{ "status": "ready" }
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid API key) |
| 404 | Not found |
| 422 | Unprocessable entity (quality threshold not met) |
| 429 | Too many requests (provider rate limited) |
| 500 | Internal server error |
| 502 | Bad gateway (provider error) |
| 503 | Service unavailable (no providers available) |

## Examples

### Start server with defaults

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
llm-translate serve
```

### Start with custom port and CORS

```bash
llm-translate serve --port 8080 --cors
```

### Start with JSON logging (for Docker)

```bash
llm-translate serve --json
```

### Start without authentication (internal use only)

```bash
llm-translate serve --no-auth
```

### Translate using curl

```bash
curl -X POST http://localhost:3000/translate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "content": "Hello, world!",
    "sourceLang": "en",
    "targetLang": "ko"
  }'
```

## Docker Deployment

See [Docker Deployment Guide](../guide/docker) for detailed instructions.

Quick start:

```bash
# Build image
docker build -t llm-translate .

# Run container
docker run -d \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-xxxxx \
  -e TRANSLATE_API_KEY=your-api-key \
  llm-translate
```

## Security Considerations

1. **Always use authentication in production** - Set `TRANSLATE_API_KEY`
2. **Use HTTPS** - Deploy behind a reverse proxy with TLS
3. **Rate limiting** - Consider adding rate limiting at the proxy level
4. **Network isolation** - Run in private networks when possible
