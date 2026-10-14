# Hợp đồng `shared/` mà template import

Template giả định các file dưới đây đã tồn tại với alias `@/` trỏ tới `src/`. Trước khi sinh module, kiểm tra dự án đã có chưa (`grep -r "class DomainError" src`). Nếu đã có file tương đương ở chỗ khác, **sửa import trong module vừa sinh** thay vì tạo file trùng. Các sketch dưới đây là mức tối thiểu, chỉnh theo dự án.

## Mục lục
- shared/domain: errors, domain-event, page
- shared/casl: actor, auth-user, app-ability, accessible-by, policies
- shared/presentation: current-actor, page-query.dto, exception filter
- Import khác các template cần

## shared/domain

```ts
// errors.ts
export abstract class DomainError extends Error {
  abstract readonly kind: 'not_found' | 'conflict' | 'business_rule' | 'validation';
  constructor(message: string, readonly code: string) { super(message); }
}

// domain-event.ts
export abstract class DomainEvent { readonly occurredAt = new Date(); }

// page.ts
export interface PageQuery { page: number; limit: number }
export interface Page<T> { items: T[]; total: number; page: number; limit: number }
```

## shared/casl

```ts
// actor.ts
export interface Actor { userId: string; roles: string[]; ability: AppAbility }

// auth-user.ts  (người dùng lấy từ JWT, dùng để dựng ability)
export interface AuthUser { id: string; roles: string[] }
```

`app-ability.ts` và `accessible-by.ts` phụ thuộc phiên bản `@casl/ability`, `@casl/prisma` và vị trí client generate, nên **viết theo README của `@casl/prisma` phiên bản đang cài**, đừng chép ví dụ cũ:

- `app-ability.ts` export type `AppAbility` (ability có subject là các model Prisma, action `manage | create | read | update | delete`). Mỗi module mới thêm subject của mình vào đây.
- `accessible-by.ts` export `accessibleBy(ability).<Model>` trả về `WhereInput` của Prisma. Với client generate ra thư mục tùy chỉnh (Prisma 7), dùng `createAccessibleByFactory` từ `@casl/prisma/runtime`.

Ghi chú đã quan sát khi kiểm tra template: `@casl/ability` 7.x không còn export `PureAbility`; `@casl/prisma` 2.x yêu cầu `@casl/ability` ^7.

```ts
// policies.ts (sketch)
export const CheckPolicy = (action: Action, subject: string) =>
  SetMetadata('policy', { action, subject });

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const policy = this.reflector.get<{ action: Action; subject: string }>('policy', ctx.getHandler());
    if (!policy) return true;
    const actor: Actor = ctx.switchToHttp().getRequest().actor; // gắn bởi middleware/guard xác thực
    return actor.ability.can(policy.action, policy.subject);
  }
}
```

`ability.factory.ts` dựng `Ability` từ `AuthUser`, gọi lần lượt `define<Name>Abilities(user, builder)` của từng module, và gắn `Actor` (`userId`, `roles`, `ability`) vào request.

## shared/presentation

```ts
// current-actor.decorator.ts
export const CurrentActor = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Actor => ctx.switchToHttp().getRequest().actor,
);

// page-query.dto.ts
export class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  toPage(): PageQuery { return { page: this.page, limit: this.limit }; }
}
```

`AppExceptionFilter` ánh xạ lỗi sang HTTP theo bảng ở `conventions.md` mục 11 (đọc `DomainError.kind`, `ForbiddenError` của CASL).

## Import khác các template cần

| Import trong template | Ý nghĩa | Chỉnh bằng |
|---|---|---|
| `@/generated/prisma/client` (`Prisma`) | namespace Prisma của client generate | `--prisma-import` |
| `@/shared/presentation/jwt-auth.guard` (`JwtAuthGuard`) | guard xác thực của dự án | `--auth-guard-import` |
| `@nestjs-cls/transactional`, `@nestjs-cls/transactional-adapter-prisma` | transaction qua CLS | cài package |
| `@nestjs/cqrs`, `@casl/ability`, `class-validator`, `@nestjs/swagger` | framework | cài package |
