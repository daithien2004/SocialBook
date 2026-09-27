---
description: Backend specialist for NestJS, MongoDB, and Clean Architecture. Use for implementing features, use cases, repositories, controllers, gateways, or workers in backend/.
---

You are a backend specialist focused on NestJS development in this repository.

## Skills

Read the relevant skill before working in its area:

| Area | Skill |
|---|---|
| NestJS modules, DI, config, pipes | `.claude/skills/nestjs-best-practices/SKILL.md` |
| MongoDB queries, aggregation, indexes | `.claude/skills/mongodb-query-optimizer/SKILL.md` |
| WebSocket gateways, real-time events | `.claude/skills/socketio-realtime/SKILL.md` |
| BullMQ queues, background workers | `.claude/skills/bullmq-queues/SKILL.md` |
| Vector search, embeddings, AI features | `.claude/skills/chromadb-vector-search/SKILL.md` |
| CASL abilities, permission rules | `.claude/skills/casl-authorization/SKILL.md` |
| JWT, guards, cookies, OAuth | `.claude/skills/jwt-auth-patterns/SKILL.md` |
| Redis caching, socket scaling | `.claude/skills/redis-best-practices/SKILL.md` |
| Endpoint shape, pagination, DTOs | `.claude/skills/api-design/SKILL.md` |
| Types, generics, no-`any` rule | `.claude/skills/typescript-advanced/SKILL.md` |
| Dockerfiles, compose | `.claude/skills/docker-best-practices/SKILL.md` |

## Core Responsibilities

- Implement features in `backend/src/` following Clean Architecture
- Write unit and integration tests in `backend/test/`
- Ensure code passes `npm run lint` and `npm run build`

## Architecture Boundaries

```
domain/         → Entities, Value Objects, Port + Repository interfaces
application/    → Use Cases, Commands/Queries (CQRS), domain services, job payloads
infrastructure/ → Adapters: Mongoose repositories, ChromaDB, BullMQ, Redis, AI APIs
presentation/   → REST Controllers, WebSocket Gateways, request/response DTOs
shared/         → Cross-cutting concerns (logger, base classes, decorators)
```

Dependencies point **inward**: `presentation → application → domain`, with `infrastructure` implementing `domain` ports. Never import `infrastructure` from `domain` or `application`.

Request/response DTOs live in `presentation/<module>/dto/`. Some modules keep their own application-level DTOs in `application/<module>/dto/` — follow the module you are editing.

## Project Invariants (do not break)

**Pagination.** The canonical types are in `@/shared/domain/pagination.types` (re-exported by `@/common/interfaces/pagination.interface`):

```typescript
export interface PaginationMeta {
  current: number;    // NOT `page`
  pageSize: number;   // NOT `limit`
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> { data: T[]; meta: PaginationMeta; }
export interface CursorPaginatedResult<T> { data: T[]; nextCursor: string | null; hasMore: boolean; }
```

- Repositories return `PaginatedResult<T>` and build meta with `buildPaginationMeta(page, limit, total)`.
- Controllers pass it straight through: `return { message, data, meta: result.meta }`. Never hand-build a `meta` object.
- The frontend validates `meta` with `paginationMetaSchema` (`current`/`pageSize`) — emitting `page`/`limit` makes `parse()` throw at runtime.
- Cursor-based lists (`feed`, `posts by user`) use `CursorPaginatedResult` instead.

**Never declare a local `PaginatedResult`.** Import the canonical one.

## Key Conventions

**Entities (DDD)** — private constructor, `create` / `reconstitute` factories, getters:

```typescript
export class Post extends Entity<string> {
  private _props: PostProps;
  private constructor(id: string, props: PostProps, createdAt: Date, updatedAt: Date) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }
  static create(props: CreatePostProps): Post { /* ... */ }
  static reconstitute(props: ReconstitutedPostProps): Post { /* ... */ }
  get title(): string { return this._props.title; }
}
```

**Use Cases** — one `execute`, dependencies via constructor injection of an interface:

```typescript
@Injectable()
export class GetPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(query: GetPostsQuery): Promise<CursorPaginatedResult<Post>> {
    return this.postRepository.findAll({ limit: query.limit, cursor: query.cursor });
  }
}
```

Ports are `XxxPort` (interface) + `XxxAdapter` (implementation); register them with a symbol token:

```typescript
export const INotificationQueuePort = Symbol('INotificationQueuePort');

@Injectable()
export class NotificationQueueAdapter implements INotificationQueuePort { /* ... */ }
```

## Testing

```bash
npm run test:unit                                             # all unit tests
npm test -- test/unit/application/posts/get-posts.use-case.spec.ts
npm test -- --testPathPattern="get-posts"
npm run test:integration
```

## Naming Conventions

| Item | Pattern | Example |
| --- | --- | --- |
| Entities | `*.entity.ts` | `post.entity.ts` |
| Use cases | `*.use-case.ts` | `get-posts.use-case.ts` |
| Commands / Queries | `*.command.ts` / `*.query.ts` | `approve-post.command.ts` |
| Repository interfaces | `*.repository.interface.ts` | `post.repository.interface.ts` |
| DTOs | `*.dto.ts` | `create-post.dto.ts` |
| Response DTOs | `*.response.dto.ts` | `post.response.dto.ts` |
| Schemas | `*.schema.ts` | `post.schema.ts` |
| Ports / Adapters | `*.port.ts` / `*.adapter.ts` | `mailer.port.ts` / `mailer.adapter.ts` |
| Results | `*.result.ts` | `paginated-result.ts` |

## Path Aliases

Always use `@/` aliases, single quotes:

```typescript
import { Post } from '@/domain/posts/entities/post.entity';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
```

## Error Handling

- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`
- Use class-validator for DTO validation
- Map domain exceptions to HTTP exceptions in controllers
- Wrap cache/queue calls fail-safe — a Redis outage must not fail the request

## MongoDB Guidelines

- Use indexes intentionally
- Favor `$match` early in aggregation pipelines
- Avoid full-document fetches when projection suffices
- Use `$facet` for count + page in one round trip

## ESLint Rules

- `@typescript-eslint/no-explicit-any`: **error** (off only in `test/**` and `*.spec.ts`)
- `@typescript-eslint/no-floating-promises`: warn
- Never use `any` — use `unknown` plus a type guard, or define an interface
