---
name: docker-best-practices
description: Docker patterns for this npm-workspace monorepo. Covers the root build-context multi-stage Dockerfiles, shared/ layer caching, npm workspace installs, non-root USER node, Next.js standalone output, and the 6-service docker-compose stack (backend, nginx, frontend, mongo, redis, chroma). Triggers on tasks involving Dockerfiles, docker-compose, container builds, or deployment.
---

# Docker Best Practices

## Overview

This is an **npm-workspace monorepo** (`backend`, `frontend`, `shared`). Both Dockerfiles build from the **repository root as context** so the `shared` package (CASL rules, constants, types) can be built and copied into each image.

## Trigger

Activate when working on:
- `backend/Dockerfile` or `frontend/Dockerfile`
- `docker-compose.yml`
- Image size / build-time optimization
- Container security
- CI/CD image builds

## The Monorepo Constraint

`backend` and `frontend` both import `@socialbook/shared`, which must be compiled to `shared/dist` before either app builds. A Dockerfile that copies only its own package **cannot build** — it needs `shared/`.

Therefore:

```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: .          # ← ROOT, not ./backend
      dockerfile: backend/Dockerfile
```

## Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# ── Layer cache: copy ONLY manifests first ──
# Editing shared/ CASL rules does NOT invalidate node_modules.
COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci

# ── Build shared BEFORE backend source ──
COPY shared ./shared
RUN npm run build:shared

COPY backend/src ./backend/src
COPY backend/tsconfig*.json ./backend/
COPY backend/nest-cli.json ./backend/

WORKDIR /app/backend
RUN npm run build

# ── Production stage: no dev deps, no build toolchain ──
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci --omit=dev --ignore-scripts --workspace=backend

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared ./shared

USER node
CMD ["node", "backend/dist/main.js"]
```

### Why This Order Matters

1. **Manifests before source** — `npm ci` is the slowest step; copying only `package*.json` first means a source edit reuses the cached dependency layer.
2. **`shared/` copied before `backend/src`** — the CASL rules change more often than backend source. Isolating `shared` keeps its build layer cacheable.
3. **`--omit=dev --ignore-scripts --workspace=backend`** — production stage ships no dev dependencies and runs no lifecycle scripts.
4. **`USER node`** — never run the app as root.

## Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci

COPY shared ./shared
RUN npm run build:shared
COPY frontend ./frontend

WORKDIR /app/frontend
# NEXT_PUBLIC_* are inlined at BUILD time — must be ARG, not runtime env
ARG NEXT_PUBLIC_NEST_API_URL
ENV NEXT_PUBLIC_NEST_API_URL=$NEXT_PUBLIC_NEST_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Next.js standalone output — only what's needed to run
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

USER node
EXPOSE 3000
CMD ["node", "frontend/server.js"]
```

### Key Points

- **`NEXT_PUBLIC_*` are build-time**: pass them as `--build-arg`. Setting them at runtime does nothing — they're inlined into the client bundle.
- **Standalone output**: `next.config` must set `output: 'standalone'`. Only `.next/standalone`, `.next/static`, and `public` are copied.
- **`USER node`** in the runner stage.

## The Compose Stack (6 services)

```yaml
services:
  backend:      # image: daithien/socialbook-be:dev   (NestJS API)
  frontend:     # image: daithien/socialbook-fe:dev   (Next.js)
  nginx:        # nginx:alpine                        (reverse proxy)
  mongo:        # mongo:7                             (primary DB)
  redis:        # redis:7-alpine                      (cache + socket scaling)
  chroma:       # chromadb/chroma:latest              (vector search)

volumes:
  mongo_data:
  redis_data:
  chroma_data:
```

### Conventions

- **`restart: unless-stopped`** on every service.
- **`env_file`** for config — secrets are not hard-coded in compose.
- **`depends_on`** to order startup (backend waits for mongo/redis/chroma).
- **Named volumes** for all stateful services — data survives `docker compose down`.
- **`expose`** for internal-only ports (backend is reached through nginx, not published directly).
- **Images are built in CI** and referenced by tag; local `build:` uses the root context.

## Commands

```bash
docker compose up -d              # start the stack
docker compose up -d mongo redis chroma   # infra only (for local dev)
docker compose logs -f backend
docker compose down               # stop (keeps volumes)
docker compose down -v            # stop AND delete data volumes
docker compose build backend      # rebuild one image
```

> For local development, run only the infra services (`mongo`, `redis`, `chroma`) and run backend/frontend with `npm run dev`.

## Image Optimization

- **Alpine base** (`node:20-alpine`) — small footprint.
- **Multi-stage** — build toolchain never reaches the runtime image.
- **`.dockerignore`** at repo root excludes `node_modules`, `.git`, `.next`, `dist`, `coverage`, `*.log`, `.env*`.
- **`npm ci`** (not `npm install`) — reproducible, lockfile-exact.

## Security

- **`USER node`** in every runner stage — non-root.
- **`--ignore-scripts`** on the production install — no arbitrary postinstall execution.
- **No secrets in images** — everything via `env_file` / build args for public values only.
- **`npm ci --omit=dev`** — smaller attack surface.
- **Pin base images** to a major (`node:20-alpine`); consider digest pinning for reproducibility.

## Anti-Patterns

- ❌ `context: ./backend` — the build needs `shared/`, so context must be the repo root.
- ❌ `COPY . .` before `npm ci` — destroys layer caching.
- ❌ Building `backend` before `shared` — `@socialbook/shared` won't resolve.
- ❌ Passing `NEXT_PUBLIC_*` as runtime env — they're build-time inlined.
- ❌ Running as root in the final stage.
- ❌ `npm install` in a Dockerfile — use `npm ci`.
- ❌ Editing files inside a running container — rebuild the image.
