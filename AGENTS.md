# SocialBook Agent Guide

## Quick Reference

- Before any task, read `.opencode/agents/CRAFTSMAN.md`
- Apply guidance from `.opencode/agents/CRAFTSMAN.md` across planning, implementation, testing, and review
- Prefer repo-specific instructions over generic habits
- Keep changes scoped. Do not rewrite unrelated areas

## Project Overview

SocialBook is a full-stack social network for book lovers.

- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion
- **Backend**: NestJS 11, TypeScript, MongoDB/Mongoose, Redis, Socket.IO
- **Infra**: Docker Compose for Redis and ChromaDB

## Repository Layout

```
backend/      NestJS API (Clean Architecture: domain/application/infrastructure/presentation)
frontend/     Next.js web app (App Router)
nginx/        Reverse proxy config
docker-compose.yml
```

## Build & Test Commands

### Infrastructure
```bash
docker-compose up -d
```

### Backend
```bash
cd backend
npm install && npm run start:dev

# Build & lint
npm run build && npm run lint

# Run single test
npm test -- test/unit/application/posts/get-posts.use-case.spec.ts
npm test -- --testPathPattern="get-posts.use-case"

# Test by type
npm run test:unit        # Unit tests (test/unit/**/*.spec.ts)
npm run test:integration # Integration tests (test/integration/**/*.spec.ts)
npm run test:e2e         # E2E tests (test/e2e/**/*.e2e-spec.ts)
npm run test:cov         # With coverage
npm run format           # Format code with Prettier
npm run seed             # Seed database
```

### Frontend
```bash
cd frontend
npm install && npm run dev
npm run build && npm run lint
```

## TypeScript Configuration

**Backend** (`backend/tsconfig.json`): `strictNullChecks: true`, `noImplicitAny: false`, `@/*` → `src/*`
**Frontend** (`frontend/tsconfig.json`): `strict: true`, `@/*` → `src/*`

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Entities | `*.entity.ts` | `post.entity.ts` |
| Use cases | `*.use-case.ts` | `get-posts.use-case.ts` |
| Repositories | `*.repository.ts` | `post.repository.interface.ts` |
| DTOs | `*.dto.ts` | `create-post.dto.ts` |
| Schemas | `*.schema.ts` | `post.schema.ts` |
| Interfaces | `*.interface.ts` | `book.interface.ts` |
| Classes/Types | PascalCase | `ReadingProgress`, `BookStatus` |
| Variables/Functions | camelCase | `getErrorMessage`, `isCompleted` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |

## Import Order

1. External dependencies (`@nestjs/common`, `react`)
2. Internal path aliases (`@/...`)
3. Relative imports (`../`, `./`)

**Backend path aliases** (required):
```typescript
import { Entity } from '@/shared/domain/entity.base';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
```

## Code Patterns

### Entities (DDD)
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

### Use Cases
```typescript
@Injectable()
export class GetPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}
  async execute(query: GetPostsQuery): Promise<PaginatedResult<Post>> {
    return this.postRepository.findAll({ skip, limit });
  }
}
```

### React Components
- Functional components with hooks
- Extract types to `.interface.ts` or `.types.ts` files
- Use Zod for form validation with react-hook-form

## Error Handling

**Backend**: NestJS built-in exceptions (`NotFoundException`, `BadRequestException`) + class-validator for DTO validation

**Frontend**:
```typescript
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (Array.isArray(error?.data?.message)) return error.data.message.join(', ');
  return error?.data?.message || error?.message || 'Đã có lỗi xảy ra.';
};
```

## Formatting & Linting

**Prettier**: `singleQuote: true`, `trailingComma: "all"`

**Backend ESLint** (`eslint.config.mjs`):
- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/no-floating-promises: warn`

**Frontend ESLint**: follows `next/core-web-vitals`, `next/typescript`

## MongoDB Guidelines

- Use indexes intentionally
- Favor `$match` early in aggregation pipelines
- Avoid unnecessary full-document fetches when projection is enough

## Required Workflow

1. Inspect affected area before changing code
2. Prefer a small plan first for non-trivial work
3. Make the smallest change that fully solves the task
4. Run targeted validation (lint, tests) for the changed area

## Local Skills

- `.opencode/skills/vercel-react-best-practices/SKILL.md`: Next.js, React, rendering, data flow (index + rules)
- `.opencode/skills/mongodb/SKILLS.md`: MongoDB queries, aggregation, index strategy
- `.opencode/skills/shadcnui/SKILLS.md`: shadcn/ui components and theming

## Environment Notes

**Backend `.env`**: `PORT`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`
**Frontend `.env.local`**: `NEXT_PUBLIC_NEST_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

Never commit secrets or replace real environment values with placeholders.

## Change Guidelines

**Backend**: Preserve Clean Architecture boundaries. Put business rules in `domain/` or `application/`. Add/update tests when behavior changes.

**Frontend**: Preserve existing design language. Prefer feature-local changes. Keep client/server component boundaries intentional.

## Review Checklist

- Change matches user request
- No unrelated files modified
- Imports, types, and paths are correct
- New behavior covered by tests or marked as unverified
- Architectural boundaries remain clean
- Sensitive values not exposed

## Communication Rules

- Be concise, specific, repo-aware
- Mention file paths and commands explicitly
- Surface tradeoffs early if a change affects architecture, data shape, or API contracts
- Follow: user instructions > this file > general preferences