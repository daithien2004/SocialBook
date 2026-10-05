# SocialBook Agent Guide

## Quick Reference

- Trước khi làm việc, đọc `.agents/rules/AGENT_TYPE_RULES.md` (luật type safety bắt buộc)
- Đọc `.claude/rules/craftsman.md` và áp dụng cho toàn bộ quy hoạch/hiện thực/kiểm thử
- Chạy `npm run check --workspace=backend` trước khi báo "xong"
- Prefer repo-specific instructions over generic habits; keep changes scoped

## Type safety (bắt buộc)

Nguồn chuẩn: `.agents/rules/AGENT_TYPE_RULES.md` (khối dưới đây phải khớp với file đó).

Dự án này cấm "ép kiểu cho qua". Compiler và lint là nguồn sự thật; không hạ chuẩn chúng.

### Cấm tuyệt đối trong `src/` (trừ file ngoại lệ bên dưới)

- `as any`, `: any`, `<any>`, `Function`/`object`/`{}` làm kiểu wildcard
- `as T`, `as unknown as T`, `<T>x`, `{} as T`, `JSON.parse(x) as T`
- `x!` (non-null assertion biểu thức)
- `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`
- `eslint-disable` cho bất kỳ rule `@typescript-eslint/*` nào liên quan đến type
- `catch (e: any)`, `(e as Error)`

Được phép: `as const`, `satisfies`, type annotation, generics, type guard (`x is T`), `name!: string` trên **property của DTO/entity/@WebSocketServer** (definite assignment).

### Khi `tsc` hoặc ESLint báo lỗi type

Làm theo thứ tự, dừng ở bước đầu tiên giải quyết được:

1. Tìm **nguồn** của lỗi (type khai báo sai? dữ liệu có thể sai lúc chạy? thư viện trả kiểu rộng?).
2. Sửa khai báo ở nguồn.
3. Thu hẹp: `typeof`/`instanceof`/`in`/kiểm tra `null`/discriminated union/type guard.
4. Dữ liệu từ ngoài (HTTP, WS, JWT, Redis, JSON, env, query raw, job, event payload) là `unknown` cho đến khi được xác thực ở **biên**: DTO class + ValidationPipe, type guard, `readJson`, `requireEnv`, `registerAs`.
5. Mô hình hóa lại: generics có ràng buộc, overload, `satisfies`, interface hẹp.
6. Đổi thiết kế (thêm nhánh `null`, ném exception có nghĩa).
7. Escape hatch: chỉ trong `src/shared/typing/unsafe.ts` hoặc `test/support/typed-fake.ts`, có `@reason` + test, và **báo cáo cho người dùng**.

Không bao giờ đổi `as T` thành `as unknown as T`. Không thêm `| undefined`/`?` để im lỗi mà không xử lý. Không sửa `tsconfig.json`, `eslint.config.mjs`, hay `eslint-suppressions.json` để làm lỗi biến mất. Cần đổi cấu hình thì hỏi người dùng.

### Test

- Không `as any`, `as unknown as jest.Mocked<X>`, `{} as Entity`.
- Dùng fake class kế thừa/cài port, interface hẹp, builder gọi factory thật, `jest.fn` suy kiểu từ cài đặt.
- Không truy cập private qua cast; test qua public API.

### Trước khi báo "xong"

- Chạy `npm run check --workspace=backend` (typecheck + lint + test) và báo kết quả.
- Báo cáo mọi type assertion mới (nếu có) theo mẫu: vị trí, vì sao không tránh được, vì sao an toàn, đã thử gì, test nào.
- Không tăng số mục trong `eslint-suppressions.json` (chỉ được giảm: `npm run lint:prune`).

### Khi bí

Dừng lại và hỏi, kèm: lỗi gốc, 2 đến 3 phương án, đánh đổi. Không cast "tạm".

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
npm run build
npm run check       # typecheck + lint + test (chạy trước khi báo xong)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint, không fix, --max-warnings 0
npm run lint:fix    # eslint --fix (tự sửa prettier/unused import)
npm run lint:prune  # bỏ suppression không còn cần

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

**Backend** (`backend/tsconfig.json`): `strict: true`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `@/*` → `src/*` (chưa bật `noUncheckedIndexedAccess`)
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
| Ports | `*.port.ts` | `mailer.port.ts` |
| Classes/Types | PascalCase | `ReadingProgress`, `BookStatus` |
| Variables/Functions | camelCase | `getErrorMessage`, `isCompleted` |

**Architecture Naming Rule**:
- `XxxPort`: Interfaces in Domain/Application that communicate with the outside world (AI, email, file storage, payment, queues). Implementations will be `XxxAdapter`.
- `XxxService`: Pure domain logic that runs entirely within the domain without touching external infrastructure. Do not use interfaces unless required for swapping or mocking.
- `Result` vs `DTO` Rule:
  - **Domain**: Contract result objects returned by Ports/Repositories use `Result` (e.g. `ModerationResult`, `FollowStatusResult`, `PaginatedResult<T>`).
  - **Application**: Output Boundary objects returned by Use Cases to Controllers use `Result` (e.g. `CreateReadingListResult`, `RecommendationResult`, `SearchBookResult`).
  - **Presentation**: HTTP response payload objects use `Dto` or `ResponseDto` (e.g. `ReadingListResponseDto`).
  - *Note*: Result is used for Domain & Application (distinguished by path). Only Presentation uses Dto/ResponseDto. Do not use `Response` (without Dto suffix) in any layer to avoid confusing with Presentation responses.
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

**Backend ESLint** (`backend/eslint.config.mjs`, theo `.agents/skills/nestjs-type-safety-enforcement`):
- `strictTypeChecked` + `consistent-type-assertions: never`, `no-explicit-any`, `no-non-null-assertion`, `ban-ts-comment`, `switch-exhaustiveness-check`, `no-floating-promises: error`
- Chỉ `src/shared/typing/unsafe.ts` và `test/support/typed-fake.ts` được cast
- Violation cũ nằm trong `backend/eslint-suppressions.json` — chỉ được giảm, không được tăng

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

- `.claude/skills/vercel-react-best-practices/SKILL.md`: Next.js, React, rendering, data flow (index + rules)
- `.claude/skills/mongodb-query-optimizer/SKILL.md`: MongoDB queries, aggregation, index strategy
- `.claude/skills/shadcnui/SKILL.md`: shadcn/ui components and theming

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