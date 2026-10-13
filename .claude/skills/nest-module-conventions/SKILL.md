---
name: nest-module-conventions
description: Quy ước cấu trúc và phân tầng cho backend NestJS feature-first của dự án (backend/src với core/, shared/, seeds/, modules/<feature>/{domain,application,infrastructure,presentation}). Dùng skill này khi tạo feature/module mới, thêm controller, gateway, command/query handler, repository, port/adapter, DTO, mapper, queue, worker/processor, đăng ký provider hoặc module, import giữa các feature, hoặc khi user hỏi "đặt code ở đâu", "file này thuộc tầng nào", "module này nối thế nào", "có nên tạo Result/DTO", "refactor cấu trúc". Dùng cả khi chỉ nói "thêm API/feature X" cho backend.
---

# Quy ước cấu trúc backend (feature-first, lai)

Lý do của quy ước: thêm một feature chỉ nên sửa **một chỗ** ở ngoài feature (import vào `AppModule`), và mọi vi phạm ranh giới bị máy bắt chứ không dựa vào việc nhớ. Sau khi sửa code, chạy `check-module-boundaries.mjs` và test.

## Bản đồ thư mục

```
backend/src/
├── main.ts / api-mode.ts      API process (WORKER_MODE=false, có HTTP + Socket.IO)
├── worker.ts / worker-mode.ts Worker process (WORKER_MODE=true, không HTTP listener)
├── app.module.ts              composition root: chỉ import CoreModule + module gốc các feature
├── core/                      hạ tầng cấp ứng dụng, nạp một lần
│   config, database (Mongo, UnitOfWork, ID generator), health, logging,
│   queue (chỉ kết nối BullMQ), redis (cache, Socket.IO adapter), runtime (CQRS, scheduler), security
├── shared/                    code dùng chung KHÔNG phụ thuộc feature
│   application, database, domain, platform, presentation, queue (schema payload, job options), schemas
├── seeds/                     phụ thuộc nhiều feature; feature KHÔNG được import seeds
└── modules/<feature>/
    ├── <feature>.module.ts    ghép controller/handler/repository/adapter của feature
    ├── presentation/          HTTP controller, WS gateway, DTO, mapper ở biên
    ├── application/           command/query, handler, port, mapper kết quả
    ├── domain/                entity, value object, repository contract, luật thuần
    └── infrastructure/        schema Mongo, repository impl, cache/queue adapter, processor, tích hợp ngoài
```
Không bắt buộc feature nào cũng đủ bốn tầng. Feature CRUD đơn giản (genres, authors) dùng controller + handler/service + repository là đủ; đừng ép đủ tầng.

## Quy tắc phụ thuộc (đã được boundary checker ép)

- `presentation → application → domain`. `infrastructure` **implement port** của application/domain. Application không import presentation/infrastructure của cùng feature.
- **Domain không import NestJS hay Mongoose.** Mongoose document không đi vào domain; repository dùng mapper `toDomain()` khi đọc.
- Feature gọi feature khác **chỉ qua public API** (module `exports` / `index.ts`), không import file nội bộ.
- `core/` và `shared/` **không import** feature. Không có vòng lặp giữa các Nest module (cần `forwardRef` thì ranh giới đang sai: tách phần chung ra module thứ ba).
- `@Global()` chỉ cho `CoreModule` (và `ConfigModule`). Còn lại import tường minh.
- Cấu hình kết nối (Mongo, Redis, BullMQ connection) ở `core/`. **`registerQueue` nằm trong feature dùng queue đó**, không đăng ký queue trong `core/` hay `shared/`.

## Thêm một feature/use case mới: checklist

1. Quyết định feature nằm ở đâu; nếu là luật nghiệp vụ/đồng thời, chạy skill `backend-consistency-design` **trước** khi code.
2. Domain: entity/value object chứa luật (ví dụ `ReadingRoom.addMember` tự kiểm tra giới hạn, không thêm trùng). Không để luật nghiệp vụ nằm trong controller hay repository.
3. Application: command/query + handler; phụ thuộc **port** (`IXxxRepository`, `XxxQueuePort`), không phụ thuộc lớp cụ thể.
4. Infrastructure: implement port, đăng ký binding trong module của feature (`provide: Port, useExisting/useClass`).
5. Presentation: DTO validate ở biên (class-validator), controller/gateway chỉ tạo command/query rồi gọi bus.
6. Thêm module vào `AppModule` imports (chỗ duy nhất ngoài feature).
7. Chạy boundary checker, lint, test.

## Command, query, và các lớp mapping

- **Command** áp dụng luật nghiệp vụ nên đi qua entity (`toDomain` → hành vi domain → save). Câu hỏi khi viết command mới: *client có cần dữ liệu này ngay không, hay chỉ cần id?* Chỉ cần id thì trả id, đừng tạo Result.
- **Query** đọc qua read repository trả read model (projection), không dựng entity. **Không dùng read model để ra quyết định nghiệp vụ** ("phòng đầy?", "được join?"): quyết định đó qua entity vì invariant nằm ở đó.
- Chuỗi giữ nguyên: Mongo doc → `toDomain()` → entity → `toResult()` → Result → `fromResult()` → Response DTO. Mỗi bước đổi một ranh giới thật. Result là kiểu thuần (không decorator Swagger), nên dùng chung được cho HTTP và ACK của WebSocket.
- DTO nên `implements` interface Result để compiler bắt lệch field khi thêm field. Có thể bật Swagger CLI plugin để bớt `@ApiProperty` thủ công.
- Module CRUD đơn giản được phép gọn hơn (read model → DTO, bỏ lớp Result). Đừng gộp Result và DTO thành một lớp rồi cho application import decorator của presentation.

## Hợp đồng API

- Mọi field nhận vào DTO phải được **dùng**, hoặc validate và trả lỗi rõ khi không hợp lệ, hoặc bỏ khỏi DTO và Swagger. Không nhận rồi bỏ qua im lặng.
- Lỗi chuẩn hóa: HTTP qua `HttpExceptionFilter` (Problem Details: status, code, detail, traceId); WebSocket qua `WsExceptionFilter` (ACK `{ ok: false, ... }` hoặc event `error`). Ném domain exception có nghĩa, đừng ném `Error` chung.
- Rate limit theo **user**, lưu ở Redis. Route nhạy cảm có throttle riêng.

## Worker và API

- API và worker dùng chung `AppModule`; `WORKER_MODE` quyết định processor nào được đăng ký (`...(isWorkerProcess() ? [Processor] : [])`). Mặc định phải là **không phải worker** khi biến chưa đặt (seed, test, script).
- `import './api-mode'` / `'./worker-mode'` phải đứng **trước** `AppModule` vì `isWorkerProcess()` đọc lúc nạp file. Công cụ sắp xếp import có thể đảo thứ tự; có test xác nhận processor **không** có trong container ở API mode và **có** ở worker mode.
- Worker không cần HTTP: ưu tiên `NestFactory.createApplicationContext` và bật `enableShutdownHooks()` để SIGTERM chờ job đang chạy xong.

## Config

Validate env bằng schema khi khởi động; thiếu biến thì fail ngay, không chạy nửa vời. Đọc cấu hình qua `ConfigService` (`forRootAsync`), không đọc `process.env` rải rác (ngoại lệ có chủ đích: `WORKER_MODE`).
