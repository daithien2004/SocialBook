---
name: nestjs-type-safety-testing
description: Viết test NestJS/TypeScript (Jest) không cast - fake class cài port thay cho as unknown as jest.Mocked, interface hẹp cho dependency, jest.fn có kiểu, test data builder thay cho {} as Entity, FakeSocket, truy cập private, Test.createTestingModule với useValue, helper typed-fake duy nhất cho thư viện ngoài. Dùng skill này bất cứ khi nào viết hoặc sửa file .spec.ts, mock dependency, mock Redis/Socket/Repository, tạo fixture entity, hoặc thấy as any/as unknown as/@ts-expect-error trong test. Also use for typed mocks in Jest, test doubles in NestJS, avoiding any in spec files, jest.Mocked alternatives.
---

# Type Safety trong test

Test là nơi AI cast nhiều nhất (`as any`, `as unknown as jest.Mocked<X>`, `{} as Entity`). Hậu quả: test vẫn xanh khi code thật đổi chữ ký, tức test **không còn bảo vệ** gì. Test cũng phải qua kiểm tra type như code thật.

Tiền đề: `nestjs-type-safety-core`.

## 1. Fake class cài port (cách mặc định)

Dự án dùng abstract class làm port/DI token, nên fake chỉ cần kế thừa/cài nó. Compiler buộc fake khớp chữ ký thật:

```ts
class InMemoryRoomRepository extends ReadingRoomRepository {
  private readonly rooms = new Map<string, Room>();
  constructor(seed: Room[] = []) {
    super();
    for (const r of seed) this.rooms.set(r.code, r);
  }
  async findByCode(code: string): Promise<Room | null> { return this.rooms.get(code) ?? null; }
  async save(room: Room): Promise<void> { this.rooms.set(room.code, room); }
}

const handler = new JoinRoomHandler(new InMemoryRoomRepository([buildRoom()]), fakeUow);
```

Port đổi chữ ký thì fake **không compile**, nên test báo ngay. Đó là điều ta muốn.

## 2. Interface hẹp thay cho mock thư viện lớn

Không mock `Redis` (hàng trăm method). Code production phụ thuộc `CachePort` (xem patterns), test cài `CachePort`:

```ts
class FakeCache extends CachePort {
  readonly store = new Map<string, string>();
  async get<T>(key: string, guard: (v: unknown) => v is T) { return readJson(this.store.get(key) ?? null, guard); }
  async set(key: string, value: unknown) { this.store.set(key, JSON.stringify(value)); }
}
```

Nếu code phụ thuộc trực tiếp vào class thư viện và muốn test, **sửa thiết kế** (thêm port) thay vì cast mock.

## 3. UnitOfWork và các port đơn giản

```ts
const fakeUow: UnitOfWork = { run: (fn) => fn(), onCommit: (cb) => { void cb(); } };
```

Object literal gán vào biến có kiểu `UnitOfWork` được compiler kiểm tra đủ method. Không `as UnitOfWork`.

## 4. `jest.fn` có kiểu

Để TS suy kiểu từ phần cài đặt, không dùng `jest.fn() as unknown as ...`:

```ts
const findByCode = jest.fn(async (_code: string): Promise<Room | null> => null);
const repo: Pick<ReadingRoomRepository, 'findByCode'> = { findByCode };
```

Chữ ký generic của `jest.fn` khác nhau giữa `@types/jest` và `@jest/globals` (và theo phiên bản); kiểm tra phiên bản đang dùng, ưu tiên cách suy từ cài đặt như trên.

## 5. Test data builder thay cho `{} as Entity`

```ts
export const buildRoom = (overrides: Partial<RoomProps> = {}): Room =>
  Room.create({ id: 'r1', code: 'ABC123', name: 'Phòng 1', ...overrides });
```

Gọi constructor/factory thật nên bất biến domain được áp dụng. Không `{ id: 'r1' } as Room`, không `Object.assign({} as Room, ...)`.

## 6. Socket giả

Code gateway phụ thuộc interface hẹp thay vì toàn bộ `Socket`:

```ts
export type RoomSocketLike = Pick<RoomSocket, 'id' | 'data' | 'join' | 'emit'>;

class FakeSocket implements RoomSocketLike { /* cài các thành viên cần dùng */ }
```

Nếu handler phải nhận `RoomSocket` đầy đủ, dựng bằng `socket.io-client`/server in-memory trong test tích hợp thay vì cast.

## 7. Test module của Nest

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    JoinRoomHandler,
    { provide: ReadingRoomRepository, useValue: new InMemoryRoomRepository() },
    { provide: UnitOfWork, useValue: fakeUow },
  ],
}).compile();

const handler = moduleRef.get(JoinRoomHandler);        // có kiểu JoinRoomHandler
```

`useValue` không được kiểm tra kiểu; vì thế **luôn truyền một biến đã có kiểu port** (fake class ở mục 1), không truyền object literal trần.

## 8. Truy cập private và `@ts-expect-error`

- Không `(svc as any).privateMethod()`. Test qua **public API**, hoặc tách logic đáng test ra hàm/class riêng có thể export.
- Không `@ts-expect-error` để truyền input sai kiểu. Muốn kiểm tra xử lý input sai lúc chạy, gọi hàm nhận `unknown` (ví dụ pipe, guard, parser):

```ts
const bad: unknown = { roomCode: 123 };
await expect(pipe.transform(bad, { type: 'body' })).rejects.toBeInstanceOf(ValidationException);
```

## 9. Đối tượng thiếu field trong assertion

```ts
expect(result).toEqual(expect.objectContaining({ roomId: 'r1' }));
```

`expect.any(...)`/`objectContaining` trả `any` nên rule `no-unsafe-*` có thể báo. Cho phép nới **`no-unsafe-assignment`/`no-unsafe-argument` chỉ trong `*.spec.ts`** (xem enforcement), **không** nới `no-explicit-any` hay cấm cast.

## 10. Helper cuối cùng: `fakeOf`

Chỉ cho thư viện ngoài mà không đáng bọc port, đặt ở **một file** `test/support/typed-fake.ts` (được phép tắt rule cast), có `@reason`:

```ts
/**
 * @reason Dựng đối tượng giả cho class bên thứ ba không bọc được. Người gọi chỉ cung cấp
 * các member mà code đang test dùng; member khác không tồn tại và sẽ nổ nếu bị gọi.
 */
export const fakeOf = <T extends object>(impl: Partial<T>): T => impl as T;
```

Báo cáo mỗi lần thêm chỗ dùng mới (mẫu ở core). Ưu tiên mục 1 và 2.

## Cạm bẫy

- `jest.Mocked<X>` kèm `as unknown as`: test xanh dù code thật đã đổi.
- Mock quá rộng khiến test chỉ kiểm tra mock chứ không kiểm tra hành vi.
- Dùng `any` để "cho nhanh" trong test rồi copy sang code thật.
- Fixture dựng bằng object literal bỏ qua bất biến domain.
- Dùng `!` trong test thay vì `if (!x) throw` hoặc `expect(x).toBeDefined()` kèm thu hẹp.
