# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SocialBook is a full-stack social network for book lovers built with:

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion, shadcn/ui
- **Backend**: NestJS 11, TypeScript, MongoDB/Mongoose, Redis, Socket.IO, ChromaDB (vector search)
- **Infra**: Docker Compose (6 services), Nginx reverse proxy

## Repository Layout

```
backend/      NestJS API (Clean Architecture: domain/application/infrastructure/presentation)
frontend/     Next.js web app (App Router)
shared/       `@socialbook/shared` — code shared by frontend & backend (CASL ability rules, constants, types)
nginx/        Reverse proxy config
docker-compose.yml
```

### Monorepo (npm workspaces)

This is an npm-workspace monorepo (`"workspaces": ["backend", "frontend", "shared"]`). Run most things from each package's directory:

```bash
npm run build:shared --workspace shared   # Build shared/ (required before backend/frontend) 
npm run dev                                # Runs backend + frontend together via concurrently
```

`frontend` and `backend` import the shared package as `@socialbook/shared` (prebuilt to `shared/dist`). After changing `shared/`, rebuild it (`npm run build:shared`) and restart the consumer.

## Build & Test Commands

### Infrastructure
```bash
docker-compose up -d  # Start Redis, MongoDB, ChromaDB, Nginx
```

### Backend
```bash
cd backend
npm install
npm run start:dev

# Build & lint
npm run build && npm run lint

# Run tests
npm run test:unit        # Unit tests (test/unit/**/*.spec.ts)
npm run test:integration # Integration tests (test/integration/**/*.spec.ts)
npm run test:e2e         # E2E tests (test/e2e/**/*.e2e-spec.ts)
npm run test:cov         # With coverage

# Run single test
npm test -- test/unit/application/posts/get-posts.use-case.spec.ts
npm test -- --testPathPattern="get-posts.use-case"

npm run format           # Format with Prettier
npm run seed             # Seed database
npm run seed:revert      # Revert last seed run
# Prod/one-off seeds (also: seed:chapter-discussions, seed:reading-rooms, ...)
node -r tsconfig-paths/register dist/shared/database/seeds/run-reading-rooms.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # predev auto-runs build:tokens (style-dictionary → design tokens)
npm run build && npm run lint
npm run typecheck        # tsc --noEmit
npm run test             # Jest unit tests
npm run test:coverage    # Jest with coverage
npm run build:tokens     # Rebuild design tokens only
npm run test:e2e         # Playwright
```

Design tokens are generated from `design-tokens/` via Style Dictionary into `src/` before `dev`/`build`; changing tokens requires regenerating them.

## Architecture

### Backend - Clean Architecture Layers

```
backend/src/
├── domain/            # Enterprise Business Rules (Entities, Value Objects, Port Interfaces)
├── application/       # Application Business Rules (CQRS: Commands, Queries, Use Cases)
├── infrastructure/    # Frameworks & External Adapters (Mongoose, Redis, AI APIs, Gateways)
├── presentation/      # Delivery Mechanism (REST Controllers, WebSocket Gateways)
└── shared/            # Cross-cutting Concerns (Logger, Base Classes, Decorators)
```

### Domain Modules (29 bounded contexts)
`ai`, `analytics`, `auth`, `authors`, `bookmarks`, `books`, `chapters`, `chroma`, `cloudinary`, `comments`, `content-moderation`, `follows`, `genres`, `library`, `likes`, `notifications`, `posts`, `progress`, `reading-room-interactions`, `reading-rooms`, `recommendations`, `reviews`, `roles`, `scraper`, `search`, `statistics`, `text-to-speech`, `user-highlights`, `users`

### Frontend Architecture
- Next.js App Router with Server/Client Component boundaries
- TanStack React Query for server state
- Zustand for client/UI state
- Socket.IO Client (namespace-based for real-time features)

## TypeScript Configuration

| Layer | Config |
|-------|--------|
| Backend | `strictNullChecks: true`, `noImplicitAny: false`, `@/*` → `src/*` |
| Frontend | `strict: true`, `@/*` → `src/*` |

## Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Entities | `*.entity.ts` | `post.entity.ts` |
| Use cases | `*.use-case.ts` | `get-posts.use-case.ts` |
| Repositories | `*.repository.interface.ts` | `post.repository.interface.ts` |
| DTOs | `*.dto.ts` | `create-post.dto.ts` |
| Schemas | `*.schema.ts` | `post.schema.ts` |
| Ports | `*.port.ts` | `mailer.port.ts` (Domain/Application layer interfaces) |
| Adapters | `*.adapter.ts` | `mailer.adapter.ts` (implementations) |
| Results | `*.result.ts` | `paginated-result.ts` |
| Response DTOs | `*.response.dto.ts` | `post.response.dto.ts` |

### Key Naming Rules

- **`XxxPort`**: Domain/Application interfaces for external communication (AI, email, file storage, payment, queues). Implementations are `XxxAdapter`.
- **`XxxService`**: Pure domain logic without external infrastructure. Avoid interfaces unless needed for swapping/mocking.
- **`Result` vs `Dto`**:
  - **Domain**: Result objects from Ports/Repositories (e.g., `ModerationResult`, `PaginatedResult<T>`)
  - **Application**: Output Boundary objects from Use Cases (e.g., `CreateReadingListResult`)
  - **Presentation**: HTTP responses use `Dto`/`ResponseDto` (e.g., `ReadingListResponseDto`)
  - Never use bare `Response` in any layer

## Import Order

1. External dependencies (`@nestjs/common`, `react`)
2. Internal path aliases (`@/...`)
3. Relative imports (`../`, `./`)

## Code Patterns

### Entity (DDD)
```typescript
export class ReadingProgress extends Entity<string> {
    private _props: ReadingProgressProps;
    private constructor(id: string, props: ReadingProgressProps, ...) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }
    static create(props: { ... }): ReadingProgress { ... }
    static reconstitute(props: { ... }): ReadingProgress { ... }
    get userId(): UserId { return this._props.userId; }
}
```

### Use Case
```typescript
@Injectable()
export class GetPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}
  async execute(query: GetPostsQuery): Promise<PaginatedResult<Post>> {
    return this.postRepository.findAll({ skip, limit });
  }
}
```

### React Component
- Functional components with hooks
- Extract types to `.interface.ts` or `.types.ts`
- Use Zod + react-hook-form for validation

## Error Handling

**Backend**: NestJS built-in exceptions + class-validator for DTO validation

**Frontend**:
```typescript
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (Array.isArray(error?.data?.message)) return error.data.message.join(', ');
  return error?.data?.message || error?.message || 'Đã có lỗi xảy ra.';
};
```

## MongoDB Guidelines

- Use indexes intentionally (compound indexes, text indexes, partial filters)
- Favor `$match` early in aggregation pipelines
- Avoid full-document fetches when projection suffices

## Local Skills / Agents / Rules

Project craft rules at `.claude/rules/craftsman.md` (read before any task).

`.claude/skills/` holds 11 curated skills. Available:

- `.claude/skills/vercel-react-best-practices/` (index + 71 rules): Next.js, React, rendering
- `.claude/skills/mongodb-query-optimizer/`: MongoDB queries, aggregation, indexes
- `.claude/skills/shadcnui/`: shadcn/ui components and theming
- Others: `api-design`, `nestjs-best-practices`, `redis-best-practices`, `jwt-auth-patterns`, `react-testing`, `tailwindcss-advanced`, `typescript-advanced`, `docker-best-practices`

`.claude/agents/` holds subagent definitions for delegated tasks (`backend.md`, `frontend.md`, `reviewer.md`).

## Environment Variables

**Backend `.env`**:
- `PORT`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`

**Frontend `.env.local`**:
- `NEXT_PUBLIC_NEST_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

## Development Workflow

1. Inspect affected area before changing code
2. Prefer small plans for non-trivial work
3. Make minimal changes that fully solve the task
4. Run targeted validation (lint, tests) for changed area

## Git Workflow

Follow `.github/GIT_FLOW.md`: branch off `develop` as `feature/*` / `fix/*` (or `hotfix/*` from `main` for urgent fixes), open a PR into `develop` (or `main` on release), merge with **Squash and merge**, then delete the branch.

## Required Rules

- **Never use `any`**: Define Interface, Type, or use `unknown`
- **Preserve Clean Architecture boundaries**: Business rules in `domain/` or `application/`
- **Preserve design language**: Keep client/server component boundaries intentional on frontend
- **Prettier**: `singleQuote: true`, `trailingComma: "all"`
- **ESLint backend**: `@typescript-eslint/no-explicit-any: error`