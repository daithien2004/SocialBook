---
name: nestjs-cqrs-testing-ops
description: Test, kiểm tra kiến trúc và checklist lên production cho NestJS CQRS (@nestjs/cqrs). Dùng skill này bất cứ khi nào người dùng viết unit test cho command/query handler, hỏi cách test CommandBus, kiểm tra mỗi command có handler chưa, enforce quy tắc phụ thuộc giữa các layer (eslint, dependency-cruiser), đo metrics/độ trễ CQRS, review "đã sẵn sàng production chưa" cho hệ thống CQRS/outbox, hoặc cần checklist triển khai và vận hành. Also use for testing NestJS CQRS handlers with fakes, handler wiring tests, architecture tests, observability and readiness checklist.
---

# NestJS CQRS: Testing và vận hành

Tiền đề: `nestjs-cqrs-foundation`, `nestjs-cqrs-pipeline`, `nestjs-cqrs-events-outbox`.

## 1. Unit test handler: không dựng bus

Handler là class thường. Tạo trực tiếp với fake, gọi `execute`:

```ts
describe('JoinRoomHandler', () => {
  const uow: UnitOfWork = { run: (fn) => fn(), onCommit: (cb) => void cb() };

  it('thêm user vào phòng và trả DTO', async () => {
    const repo = new InMemoryRoomRepository([Room.create({ id: 'r1', code: 'ABC', name: 'Phòng 1' })]);
    const handler = new JoinRoomHandler(repo, uow);

    const res = await handler.execute(new JoinRoomCommand('u1', 'ABC'));

    expect(res).toEqual({ roomId: 'r1', name: 'Phòng 1' });
    expect((await repo.findByCode('ABC'))!.hasMember('u1')).toBe(true);
  });

  it('idempotent: join hai lần vẫn thành công', async () => {
    const repo = new InMemoryRoomRepository([Room.create({ id: 'r1', code: 'ABC', name: 'P' })]);
    const handler = new JoinRoomHandler(repo, uow);
    await handler.execute(new JoinRoomCommand('u1', 'ABC'));
    await expect(handler.execute(new JoinRoomCommand('u1', 'ABC'))).resolves.toBeDefined();
  });

  it('ném RoomNotFoundException khi mã phòng không tồn tại', async () => {
    const handler = new JoinRoomHandler(new InMemoryRoomRepository([]), uow);
    await expect(handler.execute(new JoinRoomCommand('u1', 'NOPE'))).rejects.toBeInstanceOf(RoomNotFoundException);
  });
});
```

Mỗi handler tối thiểu có: đường thành công, mỗi `DomainException` có thể ném, idempotency (nếu có), xung đột đồng thời (`ConcurrencyException` từ repo giả).

Quy tắc: nếu test handler phải dựng `CqrsModule` mới chạy được thì handler đang phụ thuộc bus (vi phạm quy tắc 3 của foundation).

## 2. Test Dispatcher

- `ConcurrencyException` hai lần rồi thành công: handler được gọi 3 lần, kết quả đúng.
- `ConcurrencyException` vượt giới hạn: ném ra `ConcurrencyException`.
- `DomainException` khác: **không retry**, `outcome = domain:<code>` được ghi.
- Lỗi lạ: `outcome = system_error`, ném lại nguyên vẹn.

## 3. Test wiring: mỗi command có đúng một handler

Quên đăng ký handler chỉ lỗi lúc chạy. Hai test rẻ chặn lỗi đó:

```ts
// 1) Mỗi file *.command.ts có file *.handler.ts cùng thư mục
it('mọi command đều có handler', () => {
  const commands = globSync('src/application/**/*.command.ts');
  for (const c of commands) {
    expect(existsSync(c.replace('.command.ts', '.handler.ts'))).toBe(true);
  }
});

// 2) Handler đã nằm trong danh sách provider của module
it('mọi handler được đăng ký', () => {
  const providers: unknown[] = Reflect.getMetadata('providers', ReadingRoomsModule);
  for (const h of [...CommandHandlers, ...QueryHandlers]) expect(providers).toContain(h);
});

// 3) App khởi tạo được: handler không hợp lệ làm khởi tạo lỗi
it('app khởi tạo được', async () => {
  const app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  await app.init();   // đăng ký handler diễn ra ở bước init
  await app.close();
});
```

Điều chỉnh đường dẫn và cách glob theo project. Test (3) cần hạ tầng giả hoặc container; nếu quá nặng, chạy trong CI integration.

## 4. Kiểm tra kiến trúc tự động

Đưa các quy tắc cứng vào lint để không phụ thuộc vào review.

```js
// controller/gateway không import bus trực tiếp, không import handler/repository
{
  files: ['src/**/*.controller.ts', 'src/**/*.gateway.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{ name: '@nestjs/cqrs', importNames: ['CommandBus', 'QueryBus'], message: 'Dùng Dispatcher.' }],
      patterns: ['**/*.handler', '**/infrastructure/**'],
    }],
  },
},
// domain không import framework
{
  files: ['src/domain/**'],
  rules: {
    'no-restricted-imports': ['error', { patterns: ['@nestjs/*', 'typeorm', 'ioredis', 'socket.io'] }],
  },
}
```

Nếu dùng `dependency-cruiser`, thêm luật: `domain` không phụ thuộc `application`/`infrastructure`; `application` không phụ thuộc `presentation`; không có chu trình.

Quy tắc handler không gọi bus (không chuỗi): thêm luật cấm `CommandBus`/`QueryBus` trong `src/application/**/*.handler.ts`.

## 5. Test event và outbox

- Command thành công: có đúng một dòng outbox với `eventId`, `aggregateId`, `schemaVersion`, **trong cùng transaction** (rollback thì không có dòng nào).
- Relay: event được publish, đánh dấu `published_at`; lỗi publish tăng `attempts` và dời `next_attempt_at`; quá giới hạn thì `failed_at`.
- Consumer nhận event hai lần: tác dụng chỉ xảy ra một lần.
- Event in-process **không** phát khi transaction rollback (`onCommit` không chạy).
- Event handler ném lỗi: được `UnhandledExceptionBus` reporter ghi nhận, process không sập.

## 6. Test đồng thời và tải

- Hai command cùng sửa một aggregate chạy song song: một thành công ngay, một retry rồi thành công, không mất cập nhật.
- Load test với số kết nối WS/HTTP gần mục tiêu thật: theo dõi p95/p99 của từng command, số retry, độ trễ outbox.
- Kill process giữa lúc xử lý (chaos): không mất event, không trùng tác dụng.

## 7. Quan sát (observability)

Bắt buộc có trước khi lên production:

- **Metrics theo `kind` + `name` + `outcome`:** tổng số, histogram thời lượng, số retry `ConcurrencyException`.
- **Outbox:** pending, tuổi event cũ nhất, dead-letter, độ trễ publish.
- **Event handler:** số lỗi unhandled theo tên event/command.
- **Log có cấu trúc** kèm `correlationId` và `actorId` từ AsyncLocalStorage.
- **Trace** (OpenTelemetry) nếu có: span cho mỗi command/query, đính `correlationId`.
- Cảnh báo: dead-letter > 0, tuổi outbox vượt ngưỡng, tỉ lệ `system_error` tăng, p99 vượt SLO.

Label metrics không chứa id người dùng/phòng.

## 8. Checklist lên production

Xem `references/production-checklist.md`. Đi qua từng mục trước khi go-live và sau mỗi thay đổi lớn.
