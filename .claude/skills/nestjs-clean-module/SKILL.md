---
name: nestjs-clean-module
description: Quy chuẩn và bộ sinh khung cho module NestJS theo Clean Architecture + CQRS (@nestjs/cqrs) + Prisma 7 + CASL + nestjs-cls transactional. Dùng skill này bất cứ khi nào người dùng tạo module hoặc feature mới trong dự án NestJS, thêm API/endpoint/command/query/handler/repository/controller, thêm phân quyền CASL, xử lý transaction hay domain event, review hoặc refactor code backend NestJS, hoặc hỏi về cấu trúc thư mục, đặt tên, tách tầng domain/application/infrastructure/presentation. Dùng cả khi họ chỉ nói "thêm API cho X", "tạo module Y", "viết repository cho Z" mà không nhắc tới kiến trúc.
---

# NestJS Clean Module

Skill này giữ mọi module trong dự án theo cùng một quy chuẩn: Clean Architecture mỗi module, CQRS bằng `@nestjs/cqrs`, Prisma 7 làm chi tiết hạ tầng, CASL cho phân quyền, transaction qua `@nestjs-cls/transactional`. Lý do tồn tại: code sinh ra phải giống code đã có, để người khác đọc module nào cũng thấy quen và công cụ lint ép được luật phụ thuộc.

Đọc `references/conventions.md` trước khi viết hoặc review code. File này ngắn gọn có mục lục; đọc cả file khi tạo module mới, chỉ đọc mục liên quan khi sửa nhỏ.

## Bối cảnh stack đã chốt

- Prisma 7 + Node 24 + PostgreSQL; NestJS với `@nestjs/cqrs`.
- Mỗi module có 4 tầng `domain/`, `application/`, `infrastructure/`, `presentation/`.
- Ghi đi qua aggregate và repository; đọc đi qua read model; controller chỉ dùng `CommandBus` và `QueryBus`.
- Transaction ở command handler bằng `@Transactional()`; domain event chỉ publish sau khi commit.
- CASL hai tầng: guard kiểm tra quyền thô, handler và query repository kiểm tra quyền theo bản ghi.

Nếu repo của người dùng khác những điều trên (không dùng CQRS, ORM khác, alias khác), nói rõ chỗ khác và hỏi một câu xác nhận trước khi áp quy chuẩn này.

## Tạo module mới

1. **Kiểm tra `shared/` đã có chưa.** Tìm `DomainError`, `DomainEvent`, `Page`, `Actor`, `AppAbility`, `accessibleBy`, `PoliciesGuard`, `CurrentActor`, `PageQueryDto` trong repo. Thiếu cái nào thì đọc `references/shared-contracts.md` rồi tạo; đã có ở chỗ khác thì chỉnh import của module sinh ra, đừng tạo trùng.
2. **Lấy thông tin tối thiểu:** tên aggregate số ít và các trường nghiệp vụ chính. Nếu người dùng chưa nói trường nào, dùng khung mặc định (`id`, `ownerId`, `title`, `createdAt`) và nói rõ đó là giả định.
3. **Sinh khung:**
   ```bash
   python scripts/scaffold_module.py <tên-số-ít> --out src/modules --prisma-dir prisma/schema
   ```
   Thêm `--plural` nếu số nhiều bất quy tắc, `--prisma-import`/`--auth-guard-import` nếu đường import của dự án khác mặc định, `--dry-run` để xem trước. Script không ghi đè file đã có.
4. **Sửa khung cho đúng nghiệp vụ:** entity (bất biến, hành vi, event), mapper, read model, schema Prisma, DTO, `define<Name>Abilities`. Khung mặc định có sẵn create, rename, get, list như mẫu cho hai kiểu command (có và không có event) và hai kiểu query.
5. **Đăng ký:** subject vào `AppAbility`, `define<Name>Abilities` vào `AbilityFactory`, module vào `AppModule`.
6. **Migration:** tạo bằng `prisma migrate dev`, đọc lại SQL trước khi commit.
7. **Test** theo mục Kiểm thử trong conventions, rồi chạy lint.

Báo cho người dùng biết rõ phần nào đã sinh, phần nào còn phải làm tay (bước 4 đến 7), và những giả định đã dùng.

## Thêm command hoặc query vào module có sẵn

Không chạy script; tạo thư mục `commands/<tên>/` hoặc `queries/<tên>/` gồm file `.command.ts`/`.query.ts` và `.handler.ts`, rồi thêm handler vào `providers` của module. Chọn mẫu gần nhất trong `assets/templates/application/`:

- Tạo mới, có event: `create-*.handler.ts` (tách phần ghi vào method `@Transactional()`, publish sau commit).
- Sửa bản ghi, không event: `rename-*.handler.ts` (nạp aggregate, kiểm tra quyền, đổi trạng thái, lưu; `@Transactional()` trên `execute`).
- Đọc danh sách hoặc một bản ghi: `list-*` và `get-*` (dùng port đọc có `ability`, không transaction).

Mọi command và query đều mang `actor`. Controller chỉ thêm một method dispatch qua bus và `@CheckPolicy`.

## Review hoặc refactor

Duyệt code theo danh sách "Những điều cấm" và bảng luật phụ thuộc trong conventions. Báo từng vi phạm kèm vị trí và cách sửa, ưu tiên các lỗi làm hỏng ranh giới tầng (Prisma lọt lên handler, entity trả ra controller, event publish trong transaction, bỏ `actor`, filter của user ghi đè điều kiện CASL). Chỉ sửa những gì được yêu cầu; không tự refactor cả module khi người dùng chỉ nhờ review một file.

## Điều cần nói thẳng với người dùng

- Template đã được kiểm tra cú pháp và kiểu với package NestJS thật nhưng **chưa chạy trong dự án của họ**. Phần phụ thuộc Prisma 7 và `@casl/prisma` (client generate tùy chỉnh, `accessibleBy`) phải được xác nhận bằng spike ở module đầu tiên (conventions mục 17).
- Khi gặp chỗ quy chuẩn không phủ (batch job, websocket, upload, multi-tenant), nêu lựa chọn và lý do thay vì tự bịa quy ước mới; đề nghị bổ sung vào conventions nếu dùng lâu dài.

## Tài nguyên

- `references/conventions.md`: toàn bộ quy chuẩn (nguyên tắc, cấu trúc, luật phụ thuộc, đặt tên, từng tầng, CASL, lỗi, DB, test, điều cấm, checklist, spike).
- `references/shared-contracts.md`: các file `shared/` mà template import, kèm sketch.
- `scripts/scaffold_module.py`: sinh khung module từ `assets/templates/`.
- `assets/templates/`: code mẫu theo từng tầng; tên file dùng token `__kebab__`, `__Name__`... được script thay thế.
