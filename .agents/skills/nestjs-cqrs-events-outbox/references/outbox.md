# Transactional Outbox + Inbox (PostgreSQL)

## Schema outbox

```sql
CREATE TABLE outbox_events (
  id              uuid PRIMARY KEY,                 -- = eventId
  aggregate_type  text        NOT NULL,
  aggregate_id    text        NOT NULL,
  event_type      text        NOT NULL,
  schema_version  int         NOT NULL DEFAULT 1,
  payload         jsonb       NOT NULL,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  attempts        int         NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  failed_at       timestamptz,                      -- dead-letter: quá số lần thử
  last_error      text
);

CREATE INDEX outbox_pending_idx
  ON outbox_events (next_attempt_at)
  WHERE published_at IS NULL AND failed_at IS NULL;
```

## Ghi event (trong transaction của command)

```ts
@Injectable()
export class OutboxWriter {
  constructor(private readonly ds: DataSource) {}
  add(e: DomainEvent, aggregateType: string) {
    const m = currentManager(this.ds.manager);        // transaction hiện tại
    return m.query(
      `INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, schema_version, payload, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [e.eventId, aggregateType, e.aggregateId, e.type, e.schemaVersion, JSON.stringify(e), e.occurredAt],
    );
  }
}
```

## Relay: đọc outbox, đẩy ra queue

```sql
-- lấy lô event cần gửi; SKIP LOCKED để nhiều relay không giẫm nhau
SELECT * FROM outbox_events
 WHERE published_at IS NULL AND failed_at IS NULL AND next_attempt_at <= now()
 ORDER BY occurred_at
 LIMIT 100
 FOR UPDATE SKIP LOCKED;
```

Vòng lặp (trong một transaction ngắn mỗi lô):

1. `SELECT ... FOR UPDATE SKIP LOCKED` như trên.
2. Với mỗi event: publish ra queue/bus (BullMQ, Kafka, RabbitMQ, SQS) với `jobId`/key = `eventId` để broker dedupe nếu hỗ trợ.
3. Thành công: `UPDATE ... SET published_at = now()`.
4. Thất bại: `attempts = attempts + 1`, `next_attempt_at = now() + backoff(attempts)` (mũ + jitter), `last_error = ...`. Quá giới hạn (ví dụ 10): `failed_at = now()` và **cảnh báo**.

Chạy relay bằng worker riêng (hoặc `@Cron`/interval trong một instance). Khoảng quét 200 đến 1000 ms, hoặc dùng `LISTEN/NOTIFY` để đánh thức.

### Thứ tự

`SKIP LOCKED` với nhiều relay có thể làm event của **cùng một aggregate** đi sai thứ tự. Chọn một:

- **Một relay duy nhất** tại mỗi thời điểm (leader bằng `pg_try_advisory_lock`). Đơn giản, đủ cho đa số.
- **Phân vùng theo `hash(aggregate_id)`** để mỗi relay chỉ đọc các aggregate của mình.
- Hoặc để consumer chịu được đảo thứ tự bằng `version` (xem `read-models.md`).

### Dọn dẹp

Xóa hoặc archive event đã `published_at` quá N ngày (job định kỳ, xóa theo lô). Bảng outbox phình ra sẽ làm chậm relay.

## Consumer idempotent: inbox / dedupe

At-least-once nghĩa là consumer **sẽ** nhận trùng.

```sql
CREATE TABLE processed_events (
  consumer   text        NOT NULL,
  event_id   uuid        NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer, event_id)
);
```

```ts
await this.uow.run(async () => {
  const res = await manager.query(
    `INSERT INTO processed_events (consumer, event_id) VALUES ($1,$2)
     ON CONFLICT DO NOTHING RETURNING event_id`,
    ['notify-room', event.eventId],
  );
  if (res.length === 0) return;        // đã xử lý, bỏ qua
  await doSideEffectInDb();             // cùng transaction với dòng dedupe
});
```

Với side effect **ngoài DB** (gửi email, gọi API), không thể gom vào cùng transaction: dùng idempotency key của dịch vụ đích, hoặc chấp nhận gửi trùng hiếm gặp nếu không nghiêm trọng.

## Giám sát (bắt buộc)

- Số event pending và **tuổi của event pending cũ nhất** (cảnh báo khi vượt ngưỡng).
- Số event `failed_at IS NOT NULL` (dead-letter), cảnh báo ngay.
- Độ trễ từ `occurred_at` đến `published_at`.
- Có quy trình xử lý tay dead-letter (xem lỗi, sửa, đặt lại `failed_at = NULL`, `attempts = 0`).

## Quy tắc

- Chỉ ghi outbox trong transaction của aggregate. Không ghi từ nơi khác.
- Payload là bản chụp đủ dùng cho consumer, không tham chiếu dữ liệu mutable mà consumer phải đọc lại.
- Không xóa/đổi tên field payload đã public (xem phiên bản schema trong SKILL.md).
- Test: mô phỏng relay chết giữa chừng, event giao hai lần, queue từ chối.
