# SocialBook

SocialBook is a social platform for book lovers. It combines book discovery and reading progress with community features, collaborative reading rooms, recommendations, and background processing.

## Tech stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend:** NestJS 11, TypeScript, PostgreSQL/Prisma, Redis, Socket.IO, BullMQ
- **Search and AI:** PostgreSQL text search, ChromaDB vector search, AI and text-to-speech integrations
- **Infrastructure:** Docker Compose, Nginx, GitHub Actions

## Repository layout

```text
backend/       NestJS API and worker
frontend/      Next.js web application
shared/        Shared workspace package
docs/          Architecture notes, ADRs, and flow audits
docker-compose.yml
```

## Backend architecture

The backend is a feature-first modular monolith. Each bounded context owns its code and wiring; layers live inside the feature where they are useful.

```text
backend/src/
├── main.ts                 # HTTP API entry point
├── worker.ts               # Background worker entry point
├── app.module.ts           # Imports CoreModule and feature root modules
├── core/                   # Application-wide infrastructure and configuration
├── shared/                 # Reusable code without feature ownership
├── seeds/                  # Database seed scripts
└── modules/
    └── reading-rooms/
        ├── reading-rooms.module.ts
        ├── presentation/
        ├── application/
        ├── domain/
        └── infrastructure/
```

`core/queue` configures the BullMQ connection. A feature registers its own queues and workers. `shared/queue` contains only reusable payload schemas and job options. `CoreModule` composes the core modules; security providers and CQRS/event/scheduler setup are packaged in their own core modules. PostgreSQL migrations live in `backend/prisma/migrations/`; `backend/src/seeds/` contains seed entry points and may depend on feature APIs, while features must not depend on seeds.

Feature code must use another feature's public API. The architecture checker enforces these boundaries, inward layer dependencies, and direct cycles between Nest modules. Domain code cannot import NestJS or persistence ORM clients. The checker runs in pull request and deployment workflows.

### API and worker processes

The API starts from `backend/src/main.ts`, loads `api-mode.ts` before `AppModule`, and serves versioned routes under `/api/v1`. The worker starts from `backend/src/worker.ts`, sets `WORKER_MODE=true` before loading `AppModule`, and does not open an HTTP listener. Queue consumers, scheduled jobs, and outbox relays are registered only in worker mode so adding API replicas does not add consumers. Socket.IO uses separate Redis publisher/subscriber clients, logs connection recovery events, and closes those clients during adapter shutdown.

## Local development

### Prerequisites

- Node.js 24 or later
- npm
- Docker Compose
- Local environment files based on `backend/.env.example` and `frontend/.env.example`

Install workspace dependencies from the repository root:

```bash
npm ci
```

Create `backend/.env` and `frontend/.env.local`, then start PostgreSQL and the supporting services.

```bash
docker compose up -d postgres redis redis-queue chroma
```

Run the API, worker, and frontend together:

```bash
npm run dev
```

The web app is available at `http://localhost:3000`; the API is available at `http://localhost:5000/api/v1`. Swagger is available at `http://localhost:5000/docs`.

To run a process separately:

```bash
npm run start:dev --workspace=backend       # API
npm run start:worker:dev --workspace=backend # Worker
npm run dev --workspace=frontend             # Frontend
```

The API and worker use the same backend environment configuration. Keep `WORKER_MODE` unset or `false` for the API; `worker.ts` sets it before loading the application modules.

## Backend checks

Run the complete backend check before submitting backend changes:

```bash
npm run check --workspace=backend
```

It runs typecheck, lint, architecture checks, and Jest tests. Individual commands are available from the repository root:

```bash
npm run typecheck --workspace=backend
npm run lint --workspace=backend
npm run lint:architecture --workspace=backend
npm run test:unit --workspace=backend
npm run test:integration --workspace=backend
npm run test:e2e --workspace=backend
```

See [AGENTS.md](AGENTS.md) for repository-specific implementation and type-safety rules, [the backend README](backend/README.md) for setup and checks, and [the backend architecture overview](docs/audit/backend-architecture-overview.md) for the current module map and conventions.

## Database seeding

Seed scripts are maintained in `backend/src/seeds` and can be run with:

```bash
npm run seed --workspace=backend
```

## License

See [LICENSE](LICENSE).
