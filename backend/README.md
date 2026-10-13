# SocialBook backend

NestJS 11 backend for SocialBook. It is a feature-first modular monolith using PostgreSQL/Prisma, Redis, Socket.IO, and BullMQ.

## Structure

```text
src/
├── main.ts                 # API entry point
├── worker.ts               # Background worker entry point
├── app.module.ts           # Core and feature composition
├── core/                   # Config, DB, Redis, queue connection, logging, health, security
├── shared/                 # Reusable code without feature ownership
├── seeds/                  # Database seed scripts
└── modules/<feature>/      # Feature-owned layers and wiring
    ├── presentation/
    ├── application/
    ├── domain/
    └── infrastructure/
```

`core/queue` owns the BullMQ connection only. Features register their own queues and consumers. `shared/queue` contains reusable job schemas and options. PostgreSQL migrations live in `prisma/migrations/`; `src/seeds/` contains Prisma seed scripts. Seeds may import feature public APIs, but features must not import seeds.

The API and worker use the same `AppModule`, but worker consumers, scheduled tasks, and outbox relays are registered only when `WORKER_MODE=true`. `main.ts` loads `api-mode.ts` before `AppModule` so API role is established before feature module metadata is evaluated. `worker.ts` similarly loads `worker-mode.ts` first.

The module boundary rules are checked by `scripts/check-module-boundaries.mjs`. They cover public feature APIs, layer dependency direction, `core`/`shared` isolation, domain framework dependencies, queue registration placement, and direct Nest module cycles. The checker runs in CI.

## Local setup

From the repository root, install workspace dependencies:

```bash
npm ci
```

Create `backend/.env` from `.env.example` and configure the required variables. Set `DATABASE_URL` to PostgreSQL. To run the infrastructure with Docker Compose, configure the root `.env`, `backend.env`, and `frontend.env` files required by `docker-compose.yml`, then start PostgreSQL, Redis, the BullMQ Redis instance, and ChromaDB:

```bash
docker compose up -d postgres redis redis-queue chroma
```

Run the API and worker separately:

```bash
npm run start:dev --workspace=backend
npm run start:worker:dev --workspace=backend
```

Or start the API, worker, and frontend together from the repository root:

```bash
npm run dev
```

The API listens on port `5000` by default, uses `/api/v1` routes, and exposes Swagger at `/docs`. The worker has no HTTP listener. It consumes background queues and runs worker-only scheduled jobs. The API entry point explicitly sets `WORKER_MODE=false` before loading application modules.

## Commands

```bash
npm run build --workspace=backend
npm run check --workspace=backend
npm run test:unit --workspace=backend
npm run test:integration --workspace=backend
npm run test:e2e --workspace=backend
npm run seed --workspace=backend
```

`check` runs typecheck, ESLint, architecture checks, and Jest. See the repository [AGENTS.md](../AGENTS.md) for coding and type-safety requirements, and [the architecture overview](../docs/backend-architecture-overview.md) for the current system map.

## Application use-case conventions

Handlers should first be classified as Query, Create, Single aggregate mutation, Multi-document command, or External service. The shared rules, failure protections, and Reading Rooms reference matrix are in the [application use-case conventions](../docs/audit/backend-application-use-case-conventions.md).
