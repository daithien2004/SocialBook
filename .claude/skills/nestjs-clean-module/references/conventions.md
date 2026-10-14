# Quy chuẩn module NestJS: Clean Architecture + CQRS + Prisma 7 + CASL

Nguồn chuẩn để tạo, mở rộng và review mọi module. Code mẫu nằm trong `assets/templates/` (module mẫu sau khi sinh là `orders`). Mục ghi **(BẮT BUỘC)** không được lệch. Các mục còn lại là mặc định, chỉ đổi khi cả team đồng ý và ghi lý do trong PR.

## Mục lục
1. Nguyên tắc cốt lõi
2. Cấu trúc thư mục
3. Luật phụ thuộc giữa các tầng
4. Quy ước đặt tên
5. Tầng Domain
6. Tầng Application (command, query, event)
7. Tầng Infrastructure
8. Tầng Presentation
9. Đấu nối module
10. Phân quyền CASL
11. Lỗi và HTTP status
12. Database và Prisma schema
13. Giao tiếp giữa các module
14. Kiểm thử
15. Những điều cấm
16. Checklist module mới
17. Điểm cần kiểm chứng bằng spike

## 1. Nguyên tắc cốt lõi

1. **Dependency rule (BẮT BUỘC):** `presentation → application → domain`. `infrastructure` implement các port của domain/application. Phụ thuộc chỉ đi vào trong.
2. Domain không biết framework: không Nest, không Prisma, không CASL, không class-validator, không `@nestjs/cqrs`.
3. Prisma chỉ xuất hiện ở infrastructure. Handler và controller không import `@prisma/client` hay client generate.
4. Ghi đi qua aggregate (entity + repository). Đọc đi qua read model phẳng, không dựng entity.
5. Mỗi command hoặc query có đúng một handler; mỗi handler làm một hành động nghiệp vụ.
6. Transaction đặt ở command handler bằng `@Transactional()`. Không truyền `tx` qua tham số.
7. Phân quyền hai tầng: guard kiểm tra quyền thô (action + subject); handler và query repository kiểm tra quyền theo từng bản ghi.
8. Lỗi nghiệp vụ là domain error. HTTP status chỉ được quyết định ở presentation.

## 2. Cấu trúc thư mục

```
src/
├── shared/
│   ├── domain/            # DomainError, DomainEvent, Page, PageQuery
│   ├── casl/              # AppAbility, Actor, AuthUser, AbilityFactory, PoliciesGuard, accessible-by
│   ├── infrastructure/prisma/   # PrismaModule, PrismaService, extensions
│   └── presentation/      # AppExceptionFilter, @CurrentActor, PageQueryDto
└── modules/orders/
    ├── index.ts                   # public API: command, query, event, read model, module
    ├── orders.module.ts
    ├── domain/
    │   ├── entities/  value-objects/  events/  errors/
    │   └── repositories/order.repository.ts          # port ghi (abstract class)
    ├── application/
    │   ├── commands/<tên>/  (xxx.command.ts + xxx.handler.ts)
    │   ├── queries/<tên>/   (xxx.query.ts + xxx.handler.ts)
    │   ├── event-handlers/
    │   ├── ports/order-query.repository.ts           # port đọc (nhận ability)
    │   ├── read-models/
    │   └── policies/order.abilities.ts
    ├── infrastructure/persistence/  (prisma-*.repository.ts, order.mapper.ts)
    └── presentation/http/  (orders.controller.ts, dto/)
```

Port ghi nằm ở `domain/` vì không biết gì về quyền. Port đọc nằm ở `application/` vì nhận `ability` của CASL.

## 3. Luật phụ thuộc giữa các tầng (BẮT BUỘC)

| Tầng | Được import | Không được import |
|---|---|---|
| `domain` | chỉ `domain/` của module và `shared/domain` | Nest (kể cả `@nestjs/cqrs`), Prisma, CASL, class-validator, application, infrastructure, presentation |
| `application` | domain, `shared/domain`, `shared/casl` (chỉ type), `@nestjs/cqrs`, `Injectable`, `@nestjs-cls/transactional` | Prisma, client generate, express, infrastructure, presentation |
| `infrastructure` | domain, application (port, read model), Prisma, `@casl/prisma` | presentation |
| `presentation` | application (command, query), domain errors, `CommandBus` và `QueryBus`, Nest HTTP, class-validator, Swagger | infrastructure, Prisma, handler |

Ép bằng ESLint (`no-restricted-imports` theo thư mục) và `dependency-cruiser` hoặc `eslint-plugin-boundaries` trong CI, không dựa vào review bằng mắt. Ví dụ cho domain:

```js
{
  files: ['src/modules/*/domain/**/*.ts'],
  rules: { 'no-restricted-imports': ['error', { patterns: [
    '@nestjs/*', '@prisma/*', '@casl/*', 'class-validator', 'class-transformer',
    '**/generated/**', '**/application/**', '**/infrastructure/**', '**/presentation/**',
  ] }] },
}
```

## 4. Quy ước đặt tên

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| File | kebab-case + hậu tố loại | `confirm-order.handler.ts` |
| Command / Query | class thuần, `<Động từ><Danh từ>Command` hoặc `Query` | `ConfirmOrderCommand`, `ListOrdersQuery` |
| Handler | `<Tên command hoặc query>Handler`, cùng thư mục | `ConfirmOrderHandler` |
| Domain event | thì quá khứ, hậu tố `Event` | `OrderConfirmedEvent` |
| Event handler | `<Việc làm>On<Event>Handler` | `NotifyOnOrderConfirmedHandler` |
| Port | abstract class, không tiền tố `I` | `OrderRepository` |
| Implementation | `Prisma<Port>` | `PrismaOrderRepository` |
| Read model | `<Tên>ReadModel` | `OrderReadModel` |
| Domain error | `<Tên>Error` | `OrderNotFoundError` |
| DTO | `<Tên>Dto`, `<Tên>Response` | `CreateOrderDto` |
| Subject CASL | trùng tên model Prisma | `'Order'` |
| Action CASL | `create`, `read`, `update`, `delete`, `manage` | |
| Bảng DB | snake_case, số nhiều, `@@map` | `orders` |

Port là abstract class để dùng thẳng làm DI token, không cần `Symbol` hay `@Inject('...')`.

## 5. Tầng Domain

- Entity: không decorator, constructor private, tạo qua `create()` (kiểm tra bất biến, sinh event) và `rehydrate()` (dựng lại từ DB, không kiểm tra, không sinh event). Hành vi nằm trong entity.
- Entity tự giữ danh sách domain event và đưa ra qua `pullEvents()`. Không kế thừa `AggregateRoot` của `@nestjs/cqrs` vì nó kéo dependency Nest vào domain.
- Domain event: class thuần, field `readonly`, tên ở thì quá khứ, kế thừa `DomainEvent` của `shared/domain`.
- Domain error: kế thừa `DomainError`, mỗi lỗi có `kind` (`not_found`, `conflict`, `business_rule`, `validation`) và `code` ổn định (ví dụ `ORDER_NOT_FOUND`).
- Port ghi chỉ có vài method theo nhu cầu nghiệp vụ (`findById`, `save`), không có `findMany` chung chung.
- ID do domain hoặc handler sinh (`randomUUID()`), không phụ thuộc DB sinh.

Mẫu: `domain/` trong `assets/templates/`.

## 6. Tầng Application

**Actor (BẮT BUỘC):** handler của `@nestjs/cqrs` chỉ nhận một tham số, nên mọi command và query đều mang trường `actor: Actor` (`userId`, `roles`, `ability`). Controller truyền vào khi tạo.

**Command và handler**
- Command là class thuần chỉ chứa dữ liệu (`readonly`), không decorator, không logic.
- Handler có đúng một method `execute`, trả `void` hoặc id, không trả entity ra ngoài.
- Command có phát event: `execute` điều phối, phần ghi nằm trong method `@Transactional()` riêng và trả về danh sách event; `eventBus.publishAll(events)` gọi **sau khi transaction đã commit**. Mẫu: `create-<tên>.handler.ts`.
- Command không phát event: đặt `@Transactional()` thẳng trên `execute`. Mẫu: `rename-<tên>.handler.ts`.
- Kiểm tra quyền theo bản ghi nằm trong handler: `ForbiddenError.from(actor.ability).throwUnlessCan(action, subject('Order', obj))`. Entity phải expose đúng các field mà rule CASL tham chiếu (ví dụ `ownerId`). Nếu TypeScript phàn nàn về kiểu của subject, map entity sang object phẳng trước khi kiểm tra.

**Query và handler:** không đụng entity, không transaction, trả read model hoặc `Page<ReadModel>`. Đọc một bản ghi mà user không có quyền thì trả 404 (dùng `findAccessibleById`), không trả 403, để không lộ sự tồn tại của bản ghi.

**Quy tắc chung của handler**
- Trong một module, handler không gọi handler khác qua `CommandBus` hay `QueryBus`. Chỉ gọi sang module khác bằng command hoặc query mà module đó export (mục 13).
- Không throw `HttpException`. Chỉ throw domain error hoặc `ForbiddenError` của CASL.

**Domain event và transaction**
- Event handler (`application/event-handlers/`) chạy không đồng bộ, nên event phải publish sau commit, nếu không handler có thể đọc dữ liệu chưa tồn tại.
- Event handler không nằm trong transaction của command. Cần ghi DB thì dispatch một command mới qua `CommandBus`.
- `EventBus` mặc định chạy trong bộ nhớ, event mất nếu tiến trình chết giữa lúc lưu và publish. Event quan trọng (tiền, tồn kho, đồng bộ hệ thống ngoài) phải dùng **outbox**: ghi bảng `outbox` trong cùng transaction rồi worker đọc ra và publish.
- Event handler phải idempotent, tự bắt lỗi, ghi log và có cơ chế thử lại; lỗi không được làm đổ tiến trình.

## 7. Tầng Infrastructure

- Repository ghi lấy client từ `TransactionHost<TransactionalAdapterPrisma>` (`txHost.tx`), không inject `PrismaService` trực tiếp, để tự tham gia transaction của handler.
- Repository đọc: luôn `select` đúng cột cần, luôn gộp `accessibleBy(ability).Model` vào `where` bằng `AND` cùng filter của user, luôn giới hạn trang (`take` tối đa 100).
- Mapper (`order.mapper.ts`) là class static `toDomain`, `toPersistence`, `toReadModel`. Đây là nơi duy nhất biết cả hai hình dạng dữ liệu.
- Repository bắt lỗi Prisma (`P2002` trùng unique, `P2025` không tìm thấy) và ném domain error tương ứng. Lỗi Prisma không rò ra ngoài infrastructure.

## 8. Tầng Presentation

- DTO request dùng class-validator, có `toCommand(actor)` hoặc `toQuery(actor)`. Response là class riêng có decorator Swagger, dựng từ read model; không trả thẳng entity hay model Prisma.
- Controller mỏng: nhận DTO, dispatch đúng một command hoặc query qua `CommandBus`/`QueryBus`, trả response. Không logic nghiệp vụ, không try/catch lỗi domain, không inject handler hay repository.
- Mỗi endpoint có `@CheckPolicy(action, subject)` cho quyền thô.

## 9. Đấu nối module

- `*.module.ts` liệt kê handler (command, query, event) và bind port → implementation bằng `{ provide: Port, useClass: Impl }`. Không export handler.
- `PrismaModule`, `ClsModule` (kèm plugin Transactional) và `CqrsModule` đăng ký ở `AppModule`. Bản `@nestjs/cqrs` mới dùng `CqrsModule.forRoot()` ở root, bản cũ import `CqrsModule` ở từng module; kiểm tra theo phiên bản đang dùng.
- `index.ts` chỉ re-export command, query, event, read model (kiểu) và module. Không export handler, repository, entity, mapper.

## 10. Phân quyền CASL

- Kiểu: `shared/casl/app-ability.ts` khai báo `AppAbility`; mỗi module mới đăng ký subject của mình vào đây.
- Quyền của module: `application/policies/<module>.abilities.ts` export hàm `define<Name>Abilities(user, builder)`. `shared/casl/ability.factory.ts` gọi hàm của từng module để dựng ability cho mỗi request.
- Guard (quyền thô): `@CheckPolicy` + `PoliciesGuard`, kiểm tra `ability.can(action, subject)` không kèm điều kiện.
- Handler (theo bản ghi) và query repository (danh sách, qua `accessibleBy`) như mục 6 và 7. Filter của user không bao giờ ghi đè điều kiện quyền.
- Prisma 7 generate client vào thư mục tùy chỉnh, nên `@casl/prisma` cần file factory riêng (`shared/casl/accessible-by.ts`, dùng `createAccessibleByFactory`). Làm đúng một lần rồi mọi module dùng chung. Xem `shared-contracts.md`.

## 11. Lỗi và HTTP status

`AppExceptionFilter` (`shared/presentation/`) là nơi duy nhất ánh xạ lỗi sang HTTP:

| Nguồn lỗi | HTTP |
|---|---|
| `DomainError.kind = not_found` | 404 |
| `kind = conflict` | 409 |
| `kind = business_rule` | 422 |
| `kind = validation`, lỗi class-validator | 400 |
| `ForbiddenError` của CASL | 403 |
| Lỗi không xác định | 500, log đầy đủ, response không lộ chi tiết |

Body lỗi thống nhất: `{ code, message, details? }`, `code` lấy từ domain error.

## 12. Database và Prisma schema

- Tách file schema theo module (multi-file schema): `prisma/schema/<module>.prisma`. Mỗi module sở hữu các bảng của mình.
- Model PascalCase số ít; bảng snake_case số nhiều qua `@@map`; cột snake_case qua `@map`.
- Cột chuẩn: `id` (uuid), `createdAt`, `updatedAt`, `deletedAt` (soft delete). Mọi repository loại bản ghi đã xóa.
- Mỗi FK và mỗi cột hay lọc hoặc sắp xếp đều có index.
- Migration: tên rõ nghĩa, đọc lại SQL trước khi merge, **không sửa migration đã merge**. Môi trường thật chỉ dùng `prisma migrate deploy` trong CI/CD; không chạy lúc app khởi động; không dùng `db push`.
- Danh sách: `take` tối đa 100; bảng lớn chuyển sang cursor pagination thay vì offset sâu.

## 13. Giao tiếp giữa các module

- Chỉ import qua `index.ts` của module khác.
- Gọi sang module khác bằng `CommandBus` hoặc `QueryBus` với command hoặc query đã export. Không bao giờ dùng repository hay Prisma model của module khác.
- Phản ứng bất đồng bộ giữa module dùng domain event; module lắng nghe import class event từ `index.ts` của module phát.
- Phía ghi chỉ chạm bảng của chính module. Command dispatch sang module khác từ trong method `@Transactional()` chạy chung transaction nhờ CLS, nhưng chỉ làm vậy khi thật sự cần cùng commit; còn lại ưu tiên event.
- Phía đọc được join read-only sang bảng module khác khi có lý do, kèm comment giải thích.

## 14. Kiểm thử

| Loại | Phạm vi | Công cụ |
|---|---|---|
| Unit domain | entity, value object, quy tắc nghiệp vụ | Jest thuần, không Nest |
| Unit handler | luồng nghiệp vụ, kiểm tra quyền | Jest + repository giả (implement port) |
| Integration repository | query thật, mapper, soft delete, `accessibleBy` | PostgreSQL thật (Testcontainers hoặc docker trong CI), không mock Prisma |
| E2E | controller, guard, validation, filter lỗi | supertest |

Mỗi module tối thiểu: test domain cho mọi quy tắc nghiệp vụ; test handler cho cả đường thành công lẫn bị từ chối quyền; test repository cho mỗi query phức tạp.

## 15. Những điều cấm

- Inject `PrismaService` vào handler hoặc controller.
- Trả model Prisma hoặc entity ra khỏi handler hay controller.
- Decorator Nest, Prisma, class-validator trong `domain/`, kể cả `AggregateRoot` của `@nestjs/cqrs`.
- Logic nghiệp vụ trong controller, repository hoặc event handler.
- Inject handler hoặc repository vào controller (controller chỉ dùng `CommandBus` và `QueryBus`).
- Handler gọi handler khác trong cùng module qua bus.
- Publish event khi transaction chưa commit.
- Throw `HttpException` ngoài tầng presentation.
- Gọi `$transaction` thủ công trong handler (dùng `@Transactional()`).
- Base repository generic cho CRUD.
- `any` trong code truy cập dữ liệu; `findMany` không `take`; list không `select`.
- Import sâu vào module khác, hoặc dùng repository của module khác.
- Để filter của user ghi đè điều kiện quyền CASL.

## 16. Checklist module mới

1. Chạy `scripts/scaffold_module.py <tên>` hoặc tạo thư mục theo mục 2, đặt tên theo mục 4.
2. Sửa schema `prisma/schema/<module>.prisma`, tạo migration, review SQL.
3. Domain: entity, value object, domain error, domain event, port ghi.
4. Application: command + handler, query + handler, event handler, port đọc, read model, `define*Abilities`.
5. Đăng ký subject vào `AppAbility`; gọi `define*Abilities` trong `AbilityFactory`.
6. Infrastructure: repository ghi, repository đọc, mapper.
7. Presentation: DTO (có `toCommand(actor)`), response, controller dùng buses với `@CheckPolicy`.
8. Đấu nối `*.module.ts`, thêm vào `AppModule`, export public API qua `index.ts`.
9. Viết test theo mục 14.
10. Chạy lint (luật phụ thuộc) và CI; đảm bảo không vi phạm mục 15.

## 17. Điểm cần kiểm chứng bằng spike (làm một lần ở module đầu tiên)

1. **Prisma 7 trong NestJS:** cấu hình generator, đường dẫn output, module format (NestJS mặc định build CommonJS), driver adapter.
2. **`@nestjs-cls/transactional` với client đã `$extends`:** adapter Prisma không hỗ trợ client mở rộng dễ dàng. Nếu vướng, bỏ extension và đưa soft delete vào helper `where` của repository.
3. **`@casl/prisma` với client generate tùy chỉnh:** cần file factory riêng. Lưu ý `@casl/ability` 7.x không còn export `PureAbility`, nên nhiều ví dụ cũ trên mạng không chạy nguyên văn.
4. **`@Transactional()` trong handler của `@nestjs/cqrs`:** decorator chạy được trên method nội bộ của handler, và transaction vẫn lan truyền khi dispatch command sang module khác qua `CommandBus`.
5. **Event sau commit:** event handler chỉ chạy sau khi transaction đã commit; chốt module nào cần outbox.
