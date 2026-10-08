# UnitOfWork

## Port (application layer)

```ts
export abstract class UnitOfWork {
  /** Chạy fn trong một transaction. Nếu đã trong transaction thì tham gia transaction đó. */
  abstract run<T>(fn: () => Promise<T>): Promise<T>;

  /** Đăng ký callback chạy SAU KHI commit thành công (không chạy nếu rollback). */
  abstract onCommit(cb: () => void | Promise<void>): void;
}
```

## Cài đặt tham khảo (TypeORM; Prisma tương tự với interactive transaction)

```ts
interface TxState { manager: EntityManager; afterCommit: Array<() => void | Promise<void>> }
const als = new AsyncLocalStorage<TxState>();

export const currentManager = (fallback: EntityManager) => als.getStore()?.manager ?? fallback;

@Injectable()
export class TypeOrmUnitOfWork extends UnitOfWork {
  private readonly logger = new Logger(TypeOrmUnitOfWork.name);
  constructor(private readonly ds: DataSource) { super(); }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (als.getStore()) return fn();                       // join transaction hiện có

    const afterCommit: TxState['afterCommit'] = [];        // một mảng duy nhất, chia sẻ qua store
    const result = await this.ds.transaction((manager) =>
      als.run({ manager, afterCommit }, fn),
    );
    for (const cb of afterCommit) {                        // chỉ chạy khi đã commit thành công
      try { await cb(); }
      catch (e) { this.logger.error('afterCommit failed', e instanceof Error ? e.stack : String(e)); }
    }
    return result;
  }

  onCommit(cb: () => void | Promise<void>) {
    const s = als.getStore();
    if (!s) throw new Error('onCommit must be called inside UnitOfWork.run');
    s.afterCommit.push(cb);
  }
}
```

Callback `onCommit` lỗi chỉ được log, không làm hỏng command đã commit. Vì vậy `onCommit` chỉ phù hợp cho việc **không quan trọng** (đẩy cập nhật UI). Việc mà mất là lỗi nghiệp vụ phải đi qua outbox (skill events-outbox).

## Repository dùng transaction hiện tại

```ts
async save(room: Room) {
  const m = currentManager(this.ds.manager);
  const res = await m.update(RoomOrm, { id: room.id, version: room.version }, toRow(room));
  if (res.affected === 0) throw new ConcurrencyException();   // optimistic lock
  // ghi outbox cùng transaction nếu có event bền vững (xem skill events-outbox)
}
```

## Optimistic locking

- Cột `version` trên bảng aggregate. Câu lệnh update luôn có `WHERE id = ? AND version = ?` và tăng `version`.
- `affected = 0` → `ConcurrencyException`. `Dispatcher` sẽ retry cả handler.
- Isolation level mặc định (READ COMMITTED) là đủ cho mô hình này. Tăng isolation chỉ khi có lý do cụ thể.

## Quy tắc

- Chỉ `UnitOfWork.run` mở transaction. Repository không tự mở transaction riêng.
- Không gọi I/O ngoài DB (HTTP, email, emit socket) bên trong `run`. Đưa vào `onCommit` hoặc outbox.
- Transaction ngắn: không `await` thứ chậm hay không liên quan bên trong.
- Test: UoW giả `run: (fn) => fn()`, `onCommit: (cb) => cb()` cho unit test handler.
