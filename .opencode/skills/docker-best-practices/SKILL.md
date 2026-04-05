---
name: docker-best-practices
description: Docker containerization, multi-stage builds, Docker Compose, image optimization, and container security. Triggers on tasks involving Docker, containers, or deployment configuration.
---

# Docker Best Practices

## Overview

Guidelines for building efficient, secure, and maintainable Docker containers for Node.js applications.

## Trigger

Activate when:
- Creating Docker configurations
- Optimizing Docker images
- Setting up multi-stage builds
- Managing container orchestration
- Debugging Docker issues

## Project Structure

```
project/
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
└── src/
```

## .dockerignore

```
node_modules
.git
.env*
*.log
npm-debug.log*
dist
coverage
.nyc_output
*.test.ts
*.spec.ts
test/
```

## Node.js Dockerfile

### Multi-Stage Build (Recommended)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Simple Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --omit=dev

COPY . .

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]
```

## Docker Compose

### Development

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - mongodb
      - redis
    command: npm run start:dev

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

### Production

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=${REDIS_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  data:

networks:
  default:
    driver: bridge
```

## Security Best Practices

### Run as Non-Root

```dockerfile
# Create user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# Or use node user (exists in official images)
USER node
```

### Read-Only Filesystem

```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp
```

### Scan for Vulnerabilities

```bash
# Scan image
docker scan myapp:latest

# Use Trivy
trivy image myapp:latest
```

## Image Optimization

### Minimize Layers

```dockerfile
# BAD - Multiple layers
RUN npm install
RUN npm install -g typescript
RUN npm install -g nest

# GOOD - Single layer
RUN npm install && \
    npm install -g typescript nest
```

### Use Specific Tags

```dockerfile
# BAD - Latest can break
FROM node:latest

# GOOD - Specific version
FROM node:20.11.0-alpine3.19
```

### Order Instructions by Change Frequency

```dockerfile
# Files that change rarely first
COPY package*.json ./

# Files that change often last
COPY src/ ./src/

# CMD at the very end
CMD ["node", "dist/main.js"]
```

## Environment Variables

### Development

```yaml
environment:
  - DATABASE_URL=postgres://user:pass@db:5432/db
  - REDIS_URL=redis://redis:6379
  - LOG_LEVEL=debug
```

### Production (Secrets)

```yaml
# Use Docker secrets or external secrets manager
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  api:
    secrets:
      - db_password
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
```

## Health Checks

```dockerfile
# For Node.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

## Common Commands

```bash
# Build
docker build -t myapp:latest .

# Run
docker run -d -p 3000:3000 myapp:latest

# Compose up
docker-compose up -d

# View logs
docker-compose logs -f api

# Shell into container
docker exec -it myapp sh

# Prune unused resources
docker system prune -af
```

## Multi-Architecture Builds

```bash
# Build for multiple architectures
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:latest \
  --push \
  .
```

## Troubleshooting

### Slow Builds

1. Use `.dockerignore`
2. Order instructions by change frequency
3. Use BuildKit cache
4. Consider using `npm ci`

### Large Image Size

1. Use Alpine base images
2. Multi-stage builds
3. Remove unnecessary files
4. Combine RUN commands

### Permission Issues

```bash
# Fix ownership
RUN chown -R node:node /app
USER node
```
