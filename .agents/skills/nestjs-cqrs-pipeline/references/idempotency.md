# Idempotency cho command

## Lớp 1: idempotent tự nhiên (ưu tiên)

Thiết kế để làm lại không đổi kết quả:

- `room.join(userId)` khi đã trong phòng: no-op, trả thành công.
- `room.leave(userId)` khi không ở trong phòng: no-op.
- Tạo tài nguyên bằng id do client sinh (UUID) thay vì id server sinh, kèm unique constraint.

Cách này không cần hạ tầng thêm và đúng ngay cả khi server crash giữa chừng.

## Lớp 2: idempotency key

Dùng cho command không idempotent tự nhiên (tạo bản ghi có side effect, cộng điểm...).

- Client gửi `requestId` (UUID) cho mỗi event có thay đổi. Mỗi lần retry **dùng lại cùng** `requestId`.
- Command mang `requestId`. Handler (hoặc một decorator rõ ràng) dùng nó để chạy đúng một lần.

### Mức nhẹ: Redis

```ts
@Injectable()
export class IdempotencyStore {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async runOnce<T>(key: string, fn: () => Promise<T>, ttlSec = 86_400): Promise<T> {
    const k = `idem:${key}`;
    const claimed = await this.redis.set(k, JSON.stringify({ s: 'pending' }), 'EX', 60, 'NX');
    if (!claimed) {
      const cur = JSON.parse((await this.redis.get(k)) ?? 'null') as { s: string; r?: T } | null;
      if (cur?.s === 'done') return cur.r as T;
      throw new RequestInProgressException();           // client thử lại sau
    }
    try {
      const r = await fn();
      await this.redis.set(k, JSON.stringify({ s: 'done', r }), 'EX', ttlSec);
      return r;
    } catch (e) {
      await this.redis.del(k);                          // cho phép retry khi thất bại
      throw e;
    }
  }
}
```

Hạn chế cần biết: nếu process chết **sau khi commit nhưng trước khi** ghi `done`, hết 60 giây key `pending` biến mất và lần retry sẽ chạy lại. Chấp nhận được với thao tác nhẹ, **không** chấp nhận với thao tác quan trọng.

### Mức bền: ràng buộc trong DB

Với tiền, quota, thao tác không được trùng:

```sql
CREATE TABLE processed_commands (
  request_id uuid PRIMARY KEY,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Trong **cùng transaction** với thay đổi nghiệp vụ: `INSERT ... ON CONFLICT (request_id) DO NOTHING`. Nếu không chèn được (đã tồn tại) thì đọc `result` đã lưu và trả lại, không chạy lại. Dọn bản ghi cũ theo lịch (retention).

## Quy tắc

- Key gồm cả tên command và actor để tránh va chạm: `${userId}:${commandName}:${requestId}`.
- Kết quả lưu phải nhỏ (DTO).
- `requestId` là một phần hợp đồng client; ghi vào tài liệu API/WS.
- Query không cần idempotency key.
