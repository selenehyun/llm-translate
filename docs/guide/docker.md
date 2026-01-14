# Docker Deployment

Deploy llm-translate as a containerized API service.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/llm-translate.git
cd llm-translate

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env

# Build and start
docker compose up -d
```

## Building the Image

### Using Docker

```bash
# Build production image
docker build -t llm-translate .

# Build with specific tag
docker build -t llm-translate:v1.0.0 .

# Build without cache
docker build --no-cache -t llm-translate .
```

### Image Details

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Installs dependencies and compiles TypeScript
2. **Production stage**: Copies only production artifacts

Features:
- Based on `node:24-alpine` for minimal size
- Runs as non-root user (`llmtranslate`)
- Built-in health check
- JSON logging for container environments

## Running with Docker

### Basic Usage

```bash
docker run -d \
  --name llm-translate-api \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-xxxxx \
  -e TRANSLATE_API_KEY=your-api-key \
  llm-translate
```

### With All Options

```bash
docker run -d \
  --name llm-translate-api \
  -p 3000:3000 \
  -e TRANSLATE_PORT=3000 \
  -e TRANSLATE_API_KEY=your-secure-api-key \
  -e ANTHROPIC_API_KEY=sk-ant-xxxxx \
  -e OPENAI_API_KEY=sk-xxxxx \
  --restart unless-stopped \
  --memory 512m \
  --cpus 1 \
  llm-translate
```

### Check Container Health

```bash
# View container status
docker ps

# Check health status
docker inspect llm-translate-api --format='{{.State.Health.Status}}'

# View logs
docker logs -f llm-translate-api
```

## Running with Docker Compose

### Default Configuration

```bash
# Start service
docker compose up -d

# View logs
docker compose logs -f

# Stop service
docker compose down
```

### With Local Ollama

Run with the `with-ollama` profile to include a local Ollama instance:

```bash
docker compose --profile with-ollama up -d
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  llm-translate:
    build: .
    container_name: llm-translate-api
    restart: unless-stopped
    ports:
      - "${TRANSLATE_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - TRANSLATE_API_KEY=${TRANSLATE_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL:-http://ollama:11434}
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health/live').then(r => r.ok ? process.exit(0) : process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-translate
  labels:
    app: llm-translate
spec:
  replicas: 2
  selector:
    matchLabels:
      app: llm-translate
  template:
    metadata:
      labels:
        app: llm-translate
    spec:
      containers:
        - name: llm-translate
          image: llm-translate:latest
          ports:
            - containerPort: 3000
          env:
            - name: TRANSLATE_API_KEY
              valueFrom:
                secretKeyRef:
                  name: llm-translate-secrets
                  key: api-key
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: llm-translate-secrets
                  key: anthropic-key
          resources:
            limits:
              memory: "512Mi"
              cpu: "1000m"
            requests:
              memory: "256Mi"
              cpu: "250m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

### Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: llm-translate
spec:
  selector:
    app: llm-translate
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### Secret Manifest

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: llm-translate-secrets
type: Opaque
stringData:
  api-key: "your-translate-api-key"
  anthropic-key: "sk-ant-xxxxx"
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TRANSLATE_PORT` | No | Server port (default: 3000) |
| `TRANSLATE_API_KEY` | Recommended | API authentication key |
| `ANTHROPIC_API_KEY` | One required | Claude API key |
| `OPENAI_API_KEY` | One required | OpenAI API key |
| `OLLAMA_BASE_URL` | No | Ollama server URL |

### Resource Recommendations

| Environment | Memory | CPU |
|-------------|--------|-----|
| Development | 256MB | 0.5 |
| Production | 512MB | 1.0 |
| High load | 1GB | 2.0 |

## Health Checks

The container includes built-in health checks:

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/health` | Full status | JSON with provider info |
| `/health/live` | Liveness | `{"status": "ok"}` |
| `/health/ready` | Readiness | `{"status": "ready"}` |

### Health Check Configuration

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r => r.ok ? process.exit(0) : process.exit(1))"
```

## Logging

### JSON Logging (Default in Container)

The server uses JSON logging by default when running with `--json` flag:

```json
{"timestamp":"2024-01-15T10:30:45.123Z","requestId":"abc123","method":"POST","path":"/translate","status":200,"duration":1234}
```

### Log Aggregation

Configure your log aggregator to parse JSON logs:

```yaml
# Fluentd example
<filter docker.**>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>
```

## Security Considerations

### API Authentication

Always set `TRANSLATE_API_KEY` in production:

```bash
# Generate a secure key
export TRANSLATE_API_KEY=$(openssl rand -base64 32)
```

### Network Security

1. **Internal network**: Run behind a reverse proxy
2. **TLS termination**: Use nginx/traefik for HTTPS
3. **Rate limiting**: Configure at proxy level

### Example Nginx Configuration

```nginx
upstream llm-translate {
  server localhost:3000;
}

server {
  listen 443 ssl http2;
  server_name translate.example.com;

  ssl_certificate /etc/ssl/cert.pem;
  ssl_certificate_key /etc/ssl/key.pem;

  location / {
    proxy_pass http://llm-translate;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;

    # Rate limiting
    limit_req zone=api burst=10 nodelay;
  }
}
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs llm-translate-api

# Common issues:
# - Missing API keys
# - Port already in use
# - Insufficient memory
```

### Health check failing

```bash
# Test health endpoint manually
curl http://localhost:3000/health

# Check if providers are configured
docker exec llm-translate-api env | grep API_KEY
```

### High memory usage

```bash
# Check memory usage
docker stats llm-translate-api

# Increase memory limit if needed
docker update --memory 1g llm-translate-api
```
