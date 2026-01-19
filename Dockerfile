# ==============================================================================
# llm-translate Docker Image
# Multi-stage build for optimized production image
# ==============================================================================

# ==============================================================================
# Stage 1: Build
# ==============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm run build

# Prune dev dependencies for smaller image
RUN npm prune --production

# ==============================================================================
# Stage 2: Production
# ==============================================================================
FROM node:24-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S llmtranslate -u 1001

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=llmtranslate:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=llmtranslate:nodejs /app/dist ./dist
COPY --from=builder --chown=llmtranslate:nodejs /app/package.json ./

# Create cache directory with correct ownership
RUN mkdir -p /app/cache && chown llmtranslate:nodejs /app/cache

# Environment
ENV NODE_ENV=production
ENV TRANSLATE_PORT=3000
ENV TRANSLATE_CACHE_DIR=/app/cache

# Switch to non-root user
USER llmtranslate

EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# ENTRYPOINT for CLI, CMD for default arguments
ENTRYPOINT ["node", "dist/cli/index.js"]
CMD ["serve", "--json", "--cors", "--no-auth", "--cache-dir", "/app/cache"]
