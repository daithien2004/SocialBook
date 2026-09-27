---
name: api-design
description: REST API conventions for this NestJS + Next.js project. Covers the { data, meta } response envelope, PaginatedResult/PaginationMeta and cursor pagination, ResponseDto naming rules (Result vs Dto vs ResponseDto), class-validator DTOs, error handling with getErrorMessage, and controller→use-case wiring. Triggers on tasks involving API endpoints, DTOs, controllers, pagination, or request/response design.
---

# API Design

## Overview

This project's API follows **Clean Architecture**: controllers are thin, delegating to application use-cases. Responses use a consistent `{ data, meta? }` envelope, DTOs are named by layer, and validation is enforced with `class-validator`.

## Trigger

Activate when working on:
- New REST endpoints or controllers
- Request/response DTOs
- Pagination (offset or cursor)
- Error handling and status codes
- Naming results across layers

## Resource Naming

```
GET    /books             - List books (paginated)
GET    /books/:id         - Get one book
POST   /books             - Create
PATCH  /books/:id         - Partial update
DELETE /books/:id         - Delete

GET    /books/:id/chapters     - Nested collection
POST   /books/:id/chapters     - Create nested resource
```

- Plural, kebab-case nouns.
- Nest sub-resources under their parent.
- Use `PATCH` for partial updates (the project rarely uses full `PUT`).

## Response Envelope

### Single Resource

```typescript
// presentation/books/books.controller.ts
return { data: BookResponseDto.fromEntity(book) };
```

### Paginated List

```typescript
return {
  data: BookResponseDto.fromArray(result.data),
  meta: result.meta,
};
```

The envelope is always `{ data }` or `{ data, meta }` — never a bare array, never a bare entity.

## Pagination

### Offset Pagination (default)

Use the shared types — do **not** hand-roll the meta object:

```typescript
// shared/domain/pagination.types.ts
export interface PaginationMeta {
  current: number;      // ← NOT `page`
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    current: page,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
```

Query params: `?page=1&limit=20`.

### Cursor Pagination (infinite feeds)

For feeds (posts, notifications) prefer cursors over offset:

```typescript
export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

`nextCursor` is opaque to the client — return it verbatim on the next request.

## DTO Naming Rules (strict)

| Layer | Suffix | Example | Purpose |
|-------|--------|---------|---------|
| Domain / Repository | `Result` | `PaginatedResult<T>`, `ModerationResult` | Output of a port/repository |
| Application (use-case output) | `Result` | `CreateReadingListResult` | Output boundary of a use case |
| Presentation (HTTP) | `ResponseDto` | `BookResponseDto` | What leaves the API |

**Never** use a bare `Response` type in any layer.

### Response DTO Pattern

Response DTOs are mapping classes with static factories — entities never leak to HTTP:

```typescript
// presentation/books/dto/book.response.dto.ts
export class BookResponseDto {
  id: string;
  title: string;
  author: string;

  static fromEntity(book: Book): BookResponseDto { /* map */ }
  static fromArray(books: Book[]): BookResponseDto[] { return books.map(BookResponseDto.fromEntity); }
  static fromReadModel(model: BookReadModel): BookResponseDto { /* map */ }
}
```

## Request DTOs & Validation

```typescript
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ListBooksQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 20;
}

export class CreateBookDto {
  @IsString() @MinLength(1) @MaxLength(200)
  title: string;

  @IsString()
  author: string;
}
```

- **`@Type(() => Number)`** is required — query/params arrive as strings.
- Always cap `limit` with `@Max` to prevent unbounded reads.
- Enable `ValidationPipe({ whitelist: true, transform: true })` globally.

## HTTP Status Codes

| Code | Use |
|------|-----|
| 200 | GET, PATCH success |
| 201 | POST created |
| 204 | DELETE success |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | No permission / banned |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Server error |

## Error Handling

### Backend

Throw NestJS exceptions; the filter formats them. Domain errors are mapped in the presentation layer.

```typescript
throw new NotFoundException('Không tìm thấy sách');
throw new ForbiddenException({ statusCode: 403, message: '...', error: 'USER_BANNED' });
```

Use `getErrorMessage(error)` from `@/common/utils/error.util` when logging — never `error.message` on an `unknown`.

### Frontend

Central helper normalizes every error shape (string, `{ data: { message } }`, array of messages):

```typescript
// frontend/src/lib/utils.ts
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (Array.isArray((error as any)?.data?.message)) {
    return (error as any).data.message.join(', ');
  }
  return (error as any)?.data?.message || (error as Error)?.message || 'Đã có lỗi xảy ra.';
};
```

Always surface errors to users through `getErrorMessage` — never render a raw error object.

## Controller → Use Case Wiring

Controllers contain **no business logic**: validate → delegate → map to DTO.

```typescript
@Controller('books')
export class BooksController {
  constructor(
    private readonly getBooksUseCase: GetBooksUseCase,
    private readonly createBookUseCase: CreateBookUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListBooksQueryDto) {
    const result = await this.getBooksUseCase.execute({ page: query.page, limit: query.limit });
    return { data: BookResponseDto.fromArray(result.data), meta: result.meta };
  }
}
```

## Versioning & Docs

- Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiQuery`) document every endpoint.
- Document query params (`page`, `limit`, filters) with `@ApiQuery` so the schema is accurate.

## Anti-Patterns

- ❌ Returning entities directly — always map to a `ResponseDto`.
- ❌ Bare arrays as a response — wrap in `{ data }`.
- ❌ `page` in meta — this project uses `current`.
- ❌ Hand-built pagination meta — use `buildPaginationMeta`.
- ❌ Business logic in controllers — delegate to use-cases.
- ❌ Unbounded `limit` — always `@Max`.
- ❌ `error.message` on `unknown` — use `getErrorMessage`.
- ❌ A type named `Response` — use `Result` or `ResponseDto`.
