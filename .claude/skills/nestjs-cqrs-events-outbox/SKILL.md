---
name: nestjs-cqrs-events-outbox
description: Domain event, event handler, outbox pattern, projector/read model và xử lý lỗi event cho NestJS CQRS (@nestjs/cqrs EventBus, @EventsHandler, UnhandledExceptionBus, rethrowUnhandled, @OnEvent) chuẩn production. Dùng skill này bất cứ khi nào người dùng viết hoặc review event handler, hỏi event bị mất khi crash, publish event sau commit, outbox, inbox, at-least-once, idempotent consumer, projector, read model, saga, hoặc dùng @OnEvent/EventEmitter cho việc quan trọng như revoke token, gửi email, thanh toán. Also use for transactional outbox in NestJS, event handler error handling, eventual consistency, Socket.IO emit from domain events.
---

# NestJS CQRS: Events và Outbox

Tiền đề: `nestjs-cqrs-foundation`, `nestjs-cqrs-pipeline` (UnitOfWork, `onCommit`).

## Sự thật cần nhớ về event trong NestJS

- `EventBus` và `@nestjs/event-emitter` (`@OnEvent`) đều chạy **trong process**. Process crash giữa lúc commit và lúc xử lý thì event **mất**. Event chỉ tác động process phát ra nó, instance khác không nhận.
- Event handler chạy **bất đồng bộ**, publisher không đợi. Lỗi trong event handler **không** làm hỏng request phát event và **không** đi qua exception filter. Với `@nestjs/cqrs`, lỗi đó được đưa vào `UnhandledExceptionBus` (trừ khi bật `rethrowUnhandled`).
- Event handler gọi `commandBus.execute(...)` mà không `await`/`catch` có thể gây unhandled promise rejection làm process không ổn định.

## Quyết định: in-process hay bền vững

| Loại việc | Mất event thì sao | Cách làm |
|---|---|---|
| Cập nhật UI realtime, presence, cache nóng | Client tự đồng bộ lại ở lần sau | In-process, phát **sau commit** |
| Revoke token, gửi email, thanh toán, đồng bộ hệ thống khác, cập nhật read model quan trọng | Là lỗi nghiệp vụ | **Outbox** (bền vững, at-least-once) |

Quy tắc: nếu mất event là bug, không dùng event in-process.

## Domain event: giữ domain thuần

Domain layer **không import `@nestjs/cqrs`**. Aggregate tự gom event, application layer mới phát:

```ts
// domain/shared/aggregate-root.ts
export interface DomainEvent {
  readonly eventId: string;       // UUID, dùng để dedupe
  readonly type: string;          // 'RoomReactivated'
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly schemaVersion: number;
}

export abstract class AggregateRoot {
  private events: DomainEvent[] = [];
  protected raise(e: DomainEvent) { this.events.push(e); }
  pullEvents(): DomainEvent[] { const e = this.events; this.events = []; return e; }
}
```

Repository `save()` làm hai việc **trong cùng transaction**: ghi trạng thái aggregate và ghi các event bền vững vào outbox. Event in-process đăng ký qua `uow.onCommit`:

```ts
async save(room: Room) {
  await this.persist(room);                       // optimistic lock
  for (const e of room.pullEvents()) {
    await this.outbox.add(e);                     // bền vững: cùng transaction
    this.uow.onCommit(() => this.eventBus.publish(toBusEvent(e)));   // in-process, sau commit
  }
}
```

Không bao giờ publish event **trước** commit: handler có thể đọc dữ liệu chưa tồn tại, hoặc event đã đi trong khi transaction rollback.

## Outbox

Ghi event vào bảng outbox **cùng transaction** với dữ liệu, một relay đọc bảng và đẩy ra queue. Đảm bảo at-least-once, không mất event kể cả khi crash. Schema, relay, backoff, dead-letter, thứ tự: `references/outbox.md`.

Hệ quả: consumer sẽ nhận trùng, nên **mọi consumer phải idempotent** (inbox/dedupe theo `eventId`, cũng trong `references/outbox.md`).

## Event handler: quy tắc

```ts
@EventsHandler(RoomReactivatedEvent)
export class NotifyRoomReactivatedHandler implements IEventHandler<RoomReactivatedEvent> {
  private readonly logger = new Logger(NotifyRoomReactivatedHandler.name);
  constructor(private readonly emitter: ReadingRoomEmitter) {}

  async handle(event: RoomReactivatedEvent) {
    try {
      this.emitter.toRoom(event.roomId).emit(ServerEvent.ROOM_REACTIVATED, { by: event.by });
    } catch (e) {
      this.logger.error(`handle ${event.constructor.name} failed`, e instanceof Error ? e.stack : String(e));
    }
  }
}
```

1. **Tự bắt lỗi** (hoặc để `UnhandledExceptionBus` ghi nhận, xem dưới). Không giả định filter sẽ bắt.
2. **Idempotent.** Event có thể giao lại.
3. **Ngắn và nhanh.** Việc nặng đẩy sang queue (BullMQ).
4. **Không fire-and-forget command:** nếu phải phát command từ handler, `await` và bắt lỗi, hoặc `.catch(log)`.
5. Không giả định thứ tự giữa các event của aggregate khác nhau.
6. Event handler không ném lỗi nghiệp vụ như command handler. Lỗi ở đây là lỗi vận hành: log, đo, cảnh báo, retry.

## UnhandledExceptionBus: bắt buộc cấu hình trên production

```ts
@Injectable()
export class CqrsUnhandledExceptionReporter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('CqrsUnhandled');
  private readonly destroy$ = new Subject<void>();
  constructor(private readonly bus: UnhandledExceptionBus, private readonly metrics: CqrsMetrics) {}

  onModuleInit() {
    this.bus.pipe(takeUntil(this.destroy$)).subscribe(({ cause, exception }) => {
      const name = (cause as object)?.constructor?.name ?? 'unknown';
      this.metrics.countUnhandled(name);
      this.logger.error(
        `Unhandled exception in ${name}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    });
  }
  onModuleDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}
```

- Mặc định lỗi event handler có thể chỉ được ghi log chung. Gắn reporter này để có log có tên event, metric và cảnh báo.
- `rethrowUnhandled: true` (trong `CqrsModule.forRoot({...})`) làm lỗi được ném lại thay vì chỉ đưa vào bus. Chỉ bật khi bạn hiểu hệ quả với process; trên production thường giữ mặc định và dùng reporter.

## Việc cần bền vững thì đi qua outbox, ví dụ revoke token

`@OnEvent(USER_ROLE_CHANGED)` ghi `auth:revoked:{userId}` vào Redis: nếu crash trước khi ghi thì token cũ vẫn dùng được, đây là lỗ hổng bảo mật. Cách đúng: sự kiện đổi role ghi vào outbox cùng transaction với việc đổi role; consumer ghi Redis (idempotent, retry khi lỗi) rồi disconnect socket qua adapter. Nếu event đến từ process khác với process chạy gateway, dùng Redis pub/sub hoặc `@socket.io/redis-emitter` để tới đúng socket.

## Saga

- `@Saga` (RxJS) phản ứng event bằng cách phát command. Dùng ít, cho quy trình ngắn, rõ ràng.
- Quy trình dài (nhiều bước, cần bù trừ) cần trạng thái bền vững (process manager lưu trong DB), không nên chỉ nằm trong stream RxJS.
- Lỗi trong saga không đi qua filter, xử lý như event handler.

## Read model và projector

Khi cần tách đọc/ghi sâu hơn: `references/read-models.md` (projector idempotent, chống đảo thứ tự bằng version, rebuild, đo độ trễ). Chỉ làm khi bước rẻ hơn (index, cache, bảng đọc cập nhật cùng transaction) không đủ.

## Phiên bản schema event

- Chỉ **thêm** field (tùy chọn), không đổi tên/xóa field đã public.
- Thay đổi phá vỡ tương thích: tăng `schemaVersion`, consumer hỗ trợ cả hai trong thời gian chuyển.
- Mỗi event có `eventId`, `aggregateId`, `occurredAt`, `schemaVersion`.

## Cạm bẫy

- Dùng `@OnEvent`/`EventBus` cho việc mà mất là bug.
- Publish trước commit.
- Event handler không `try/catch` và không có reporter.
- Fire-and-forget `commandBus.execute` trong event handler.
- Consumer không idempotent trong khi outbox giao at-least-once.
- Trộn `EventBus` của cqrs và `@nestjs/event-emitter` cho cùng một loại event.
- Aggregate import `@nestjs/cqrs` (domain bị dính framework).
