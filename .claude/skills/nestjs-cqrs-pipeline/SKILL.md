---
name: nestjs-cqrs-pipeline
description: Xử lý cross-cutting cho NestJS CQRS (@nestjs/cqrs) chuẩn production - Dispatcher facade quanh CommandBus/QueryBus, logging, metrics, retry khi ConcurrencyException, UnitOfWork/transaction, idempotency key, AsyncLocalStorage request context, correlation id. Dùng skill này bất cứ khi nào người dùng hỏi command bus có middleware/interceptor không, muốn log hoặc đo thời gian mọi command, retry optimistic lock, transaction trong handler, chống xử lý trùng khi client retry, truyền correlation id hoặc actor qua handler, hoặc nói "handler lặp code log/transaction/retry". Also use for MediatR-style pipeline behaviors in NestJS, optimistic concurrency retry, idempotent commands, UnitOfWork pattern.
---

# NestJS CQRS Pipeline (cross-cutting)

`@nestjs/cqrs` **không có middleware/interceptor cho bus**. Guard, interceptor, pipe của Nest chỉ chạy ở tầng controller/gateway, không chạy khi `commandBus.execute()` gọi handler. Nên log, metrics, retry, transaction phải tự dựng ở **một chỗ duy nhất**.

Cách khuyến nghị: **Dispatcher facade** (một service bọc `CommandBus`/`QueryBus`) + **UnitOfWork** (transaction tường minh trong handler) + **AsyncLocalStorage** (context).

Tiền đề: `nestjs-cqrs-foundation`. Liên quan: `nestjs-error-catalog` (`ConcurrencyException`, `DomainException`).

## 1. Dispatcher facade

```ts
// application/common/dispatcher.ts
@Injectable()
export class Dispatcher {
  private readonly logger = new Logger(Dispatcher.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly metrics: CqrsMetrics,
  ) {}

  command<R>(cmd: Command<R>): Promise<R> {
    return this.observe('command', cmd, () =>
      this.retryOnConcurrency(() => this.commandBus.execute(cmd)),
    );
  }

  query<R>(q: Query<R>): Promise<R> {
    return this.observe('query', q, () => this.queryBus.execute(q));
  }

  private async observe<R>(kind: 'command' | 'query', msg: object, fn: () => Promise<R>): Promise<R> {
    const name = msg.constructor.name;
    const start = process.hrtime.bigint();
    let outcome = 'ok';
    try {
      return await fn();
    } catch (e) {
      outcome = e instanceof DomainException ? `domain:${e.code}` : 'system_error';
      throw e;   // chỉ ném lại; filter chịu trách nhiệm log lỗi để không log đôi
    } finally {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      this.metrics.observe(kind, name, outcome, ms);
      this.logger.debug({ kind, name, outcome, ms, ...currentContext() });
    }
  }

  private async retryOnConcurrency<R>(fn: () => Promise<R>): Promise<R> {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; ; attempt++) {
      try {
        return await fn();
      } catch (e) {
        if (!(e instanceof ConcurrencyException) || attempt >= MAX_ATTEMPTS) throw e;
        const backoff = 20 * 2 ** attempt + Math.random() * 20;   // jitter tránh retry đồng loạt
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }
}
```

Điều chỉnh kiểu cho khớp phiên bản `@nestjs/cqrs` đang dùng nếu TypeScript phàn nàn về suy kiểu của `execute`.

### Vì sao retry ở đây và chỉ với `ConcurrencyException`

- `ConcurrencyException` (optimistic lock thất bại) nghĩa là **transaction đã rollback**, chưa có gì được commit, nên chạy lại cả handler là an toàn.
- Không retry lỗi khác: lỗi nghiệp vụ retry vô ích, lỗi hệ thống có thể đã gây side effect.
- **Handler không được tạo side effect ngoài DB trước khi commit** (gửi email, emit socket, gọi API ngoài). Side effect đi qua event sau commit (skill events-outbox). Nếu vi phạm, retry sẽ làm side effect chạy nhiều lần.
- Giới hạn số lần (3) và có jitter. Số lần retry cao cho thấy contention thật, cần xem lại thiết kế aggregate chứ không phải tăng retry.

### Quy tắc dùng

- Gateway/controller inject **`Dispatcher`**, không inject `CommandBus`/`QueryBus`.
- Ép bằng lint (mục 6).
- Metrics: label chỉ gồm `kind`, `name`, `outcome` (có `domain:<code>`). **Không** đưa id người dùng/phòng vào label (bùng nổ cardinality).

## 2. Request context bằng AsyncLocalStorage

```ts
// application/common/request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext { correlationId: string; actorId?: string }
const als = new AsyncLocalStorage<RequestContext>();

export const runWithContext = <T>(ctx: RequestContext, fn: () => T): T => als.run(ctx, fn);
export const currentContext = (): Partial<RequestContext> => als.getStore() ?? {};
```

Thiết lập **tại biên transport**, mỗi request/event một lần:

```ts
// HTTP: middleware
app.use((req, _res, next) =>
  runWithContext({ correlationId: (req.headers['x-request-id'] as string) ?? randomUUID() }, next));

// WS: interceptor áp cho từng event
@Injectable()
export class WsContextInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const socket = ctx.switchToWs().getClient<Socket>();
    const rc: RequestContext = { correlationId: randomUUID(), actorId: socket.data?.userId };
    // bọc cả lúc subscribe để context đi theo toàn bộ chuỗi async của handler
    return new Observable((sub) => runWithContext(rc, () => next.handle().subscribe(sub)));
  }
}
```

Dùng context cho **log và trace**, không dùng để ra quyết định nghiệp vụ. Dữ liệu nghiệp vụ (`userId`) vẫn truyền tường minh trong command.

## 3. UnitOfWork (transaction)

Handler tự mở transaction **tường minh**: `uow.run(...)`. Không giấu trong decorator magic. Chi tiết, kèm `onCommit` để phát event sau commit: `references/unit-of-work.md`.

```ts
return this.uow.run(async () => {
  const room = await this.rooms.findByCode(code);
  room.join(userId);
  await this.rooms.save(room);       // repo tự lấy transaction hiện tại từ ALS
  return toDto(room);
});
```

Quy tắc: **một command = một transaction = một aggregate** (ưu tiên). Cần sửa nhiều aggregate cùng lúc là dấu hiệu ranh giới aggregate sai, hoặc nên dùng event + eventual consistency.

## 4. Idempotency

Client retry vì mất mạng thì command chạy hai lần. Hai lớp bảo vệ, dùng theo thứ tự:

1. **Idempotent tự nhiên (ưu tiên):** thiết kế domain để làm lại không đổi kết quả (`join` khi đã ở trong phòng là no-op và trả thành công).
2. **Idempotency key** cho command không idempotent tự nhiên: client gửi `requestId` (UUID) cho mỗi event có thay đổi; server lưu kết quả theo key.

Chi tiết và code: `references/idempotency.md`. Với thao tác quan trọng (tiền, quota), key phải được ràng buộc **trong DB cùng transaction** (unique constraint), Redis một mình không đủ.

## 5. Giới hạn tải và timeout

- Rate limit **ở transport** (theo user/IP), không ở bus.
- Timeout bằng cấu hình tầng DB (`statement_timeout`, `lock_timeout`), không dùng `Promise.race` quanh handler: hủy promise không dừng được truy vấn đang chạy, chỉ làm client tưởng đã thất bại trong khi dữ liệu vẫn có thể được ghi.
- Handler chậm (xuất báo cáo, gửi hàng loạt) đẩy sang queue (BullMQ), command chỉ ghi job và trả ngay.

## 6. Ép dùng Dispatcher bằng lint

```js
// eslint.config.mjs
{
  files: ['src/**/*.controller.ts', 'src/**/*.gateway.ts', 'src/presentation/**'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{
        name: '@nestjs/cqrs',
        importNames: ['CommandBus', 'QueryBus'],
        message: 'Dùng Dispatcher thay vì inject bus trực tiếp.',
      }],
    }],
  },
}
```

## 7. Cạm bẫy

- Gateway gọi thẳng `CommandBus`: mất log/metrics/retry.
- Retry khi handler có side effect ngoài DB trước commit.
- `Promise.race` timeout quanh handler.
- Label metrics chứa id.
- Log lỗi ở cả Dispatcher lẫn filter (log đôi). Chỉ filter log lỗi.
- Dùng ALS để quyết định nghiệp vụ.
- Lồng `uow.run` mà không join transaction hiện có (xem reference).
- Quên bọc `subscribe` trong interceptor WS khiến context mất giữa chừng.
