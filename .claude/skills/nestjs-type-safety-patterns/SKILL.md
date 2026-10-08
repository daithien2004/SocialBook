---
name: nestjs-type-safety-patterns
description: Các mẫu mô hình hóa type trong NestJS/TypeScript để KHÔNG cần cast - discriminated union và exhaustive check, type guard và assertion function, satisfies, as const, generics có ràng buộc, overload, thu hẹp null/undefined thay cho non-null assertion, noUncheckedIndexedAccess, Object.keys/entries có kiểu, value object và branded id, interface hẹp (ISP), explicit return type, mapper từng field. Dùng skill này bất cứ khi nào định cast vì "compiler không hiểu", cần ánh xạ giữa các kiểu, xử lý union/enum/event/result, hoặc thiết kế type cho handler, repository, event, error. Also use for exhaustive switch, assertNever, satisfies operator, generic constraints, branded types in TypeScript.
---

# Type Safety Patterns: mô hình hóa để không cần cast

Phần lớn cast xuất hiện vì **type mô tả sai thực tế** hoặc **thiết kế ép compiler đoán**. Sửa cách mô hình hóa thì cast tự biến mất.

Tiền đề: `nestjs-type-safety-core`. Dữ liệu từ ngoài: `nestjs-type-safety-boundaries`.

## 1. Discriminated union thay cho "một type + field tùy chọn"

```ts
// Tệ: kind và field đi kèm không ràng buộc nhau => phải cast
interface RoomEvent { type: string; roomId: string; by?: string; name?: string }

// Tốt
type RoomEvent =
  | { type: 'RoomReactivated'; roomId: string; by: string }
  | { type: 'RoomRenamed'; roomId: string; name: string; version: number };

function describe(e: RoomEvent): string {
  switch (e.type) {
    case 'RoomReactivated': return `by ${e.by}`;        // e đã được thu hẹp
    case 'RoomRenamed': return e.name;
    default: return assertNever(e);                      // thêm event mới mà quên xử lý => lỗi compile
  }
}

export function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}
```

Dùng cho: event, kết quả (`{ ok: true; data } | { ok: false; error }`), trạng thái, message. Bật `@typescript-eslint/switch-exhaustiveness-check`.

## 2. Type guard và assertion function: phải kiểm tra thật

```ts
const isRoomEvent = (v: unknown): v is RoomEvent =>
  isRecord(v) && typeof v.type === 'string' && typeof v.roomId === 'string' /* ... */;

function assertIsRoomEvent(v: unknown): asserts v is RoomEvent {
  if (!isRoomEvent(v)) throw new Error('Invalid RoomEvent');
}
```

Một guard cũng là một lời hứa: nếu thân hàm không kiểm tra đủ, nó là cast trá hình. Guard phải kiểm **mọi field** mà phần sau dùng, và có test cho trường hợp sai.

## 3. `satisfies` giữ kiểu literal và vẫn kiểm tra

```ts
export const ERROR_STATUS = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.CONCURRENCY_CONFLICT]: 409,
} satisfies Partial<Record<ErrorCode, number>>;
// ERROR_STATUS.VALIDATION_ERROR có kiểu literal 400, sai key/kiểu giá trị => lỗi compile
```

Dùng thay cho `{ ... } as Config` (cast không kiểm tra thiếu field).

## 4. `as const` và suy ra type từ giá trị

```ts
export const ROLES = ['user', 'moderator', 'admin'] as const;
export type Role = (typeof ROLES)[number];
export const isRole = isOneOf(ROLES);
```

Một nguồn sự thật cho cả giá trị chạy được và type. `Record<ErrorCode, string>` ép catalog đầy đủ (thiếu key là lỗi compile).

## 5. Generics có ràng buộc thay cho cast

```ts
// Tệ
const get = (o: Config, k: string) => o[k as keyof Config];

// Tốt
const get = <K extends keyof Config>(o: Config, k: K): Config[K] => o[k];
```

Hàm trả về kiểu phụ thuộc đối số: dùng generic hoặc **overload**, không trả `unknown`/`any` rồi cast ở nơi gọi.

```ts
function parse(input: string, as: 'number'): number;
function parse(input: string, as: 'boolean'): boolean;
function parse(input: string, as: 'number' | 'boolean'): number | boolean {
  return as === 'number' ? Number(input) : input === 'true';
}
```

## 6. `null`/`undefined`: xử lý, đừng khẳng định

```ts
// Tệ
const room = (await repo.findByCode(code))!;
// Tốt
const room = await repo.findByCode(code);
if (!room) throw new RoomNotFoundException(code);
```

- Bật `noUncheckedIndexedAccess`: `arr[0]` và `record[key]` có kiểu `T | undefined`, buộc xử lý trường hợp không có.
- Giá trị mặc định bằng `??`, không bằng `as`.
- Nếu một hàm luôn có kết quả theo thiết kế, **đổi kiểu trả về** (không trả `T | null` nếu không bao giờ null), thay vì `!` ở người gọi.

## 7. `Object.keys/entries/values` có kiểu

`Object.keys` trả `string[]` theo thiết kế. Cách không cần cast:

```ts
// 1. Duyệt mảng định nghĩa sẵn
for (const code of ERROR_CODES) { ... }          // ERROR_CODES là `as const`

// 2. Object.values/entries đã đủ kiểu cho giá trị
for (const [key, value] of Object.entries(map)) { /* key: string, value: V */ }

// 3. Tập key đóng và đã được khóa kiểu: dùng typedKeys từ unsafe.ts (có @reason, có test)
```

## 8. Lọc mảng giữ kiểu

```ts
const present = items.filter((x): x is Item => x != null);          // tường minh
const ids = rooms.map((r) => r.id);                                  // đã là string[]
```

TS 5.5 suy ra predicate cho các hàm lọc đơn giản; vẫn nên viết predicate tường minh khi ý đồ không hiển nhiên.

## 9. Interface hẹp (ISP) thay vì kiểu khổng lồ

```ts
// Code chỉ cần get/set => phụ thuộc interface hẹp, không phụ thuộc Redis
export abstract class CachePort {
  abstract get<T>(key: string, guard: (v: unknown) => v is T): Promise<T | null>;
  abstract set(key: string, value: unknown, ttlSec: number): Promise<void>;
}
```

Lợi ích: fake trong test chỉ cần cài hai method, không cần `as unknown as Redis` (xem testing).

## 10. Value object và id có nhãn (tùy chọn)

Chỉ làm khi dự án đã gặp lỗi nhầm `userId` với `roomId`. Cách không cần cast:

```ts
export class UserId {
  private constructor(readonly value: string) {}
  static of(value: string): UserId {
    if (!isNonEmptyString(value)) throw new InvalidIdException('UserId');
    return new UserId(value);
  }
}
```

Branded type (`string & { __brand }`) cần một cast ở hàm tạo, nên đặt hàm đó trong `unsafe.ts` kèm `@reason` nếu chọn hướng này.

## 11. Mapper từng field

```ts
const toRoomDto = (r: Room): RoomDto => ({ id: r.id, name: r.name, memberCount: r.members.length });
```

Không `{ ...row } as Dto`, không `Object.assign({} as Dto, row)`. Thêm field vào DTO thì compiler buộc cập nhật mapper.

## 12. Khai báo kiểu trả về tường minh

- Hàm public, handler, repository method: **ghi rõ kiểu trả về**. Suy luận ngầm dễ để lọt `any` từ thư viện và làm lỗi hiện ra ở nơi khác.
- `Promise<void>` thay vì để suy luận cho handler không trả gì.

## 13. NestJS cụ thể

- `ICommandHandler<Cmd, Result>`, `Command<Result>`, `Query<Result>`: điền đủ generic để `commandBus.execute` trả đúng kiểu.
- Tham chiếu class: `Type<T>` từ `@nestjs/common`.
- `ModuleRef.get<T>()` là generic không kiểm chứng: ưu tiên DI qua constructor.
- Provider đa hình: dùng abstract class làm token (`abstract class RoomRepository`), không `string` token kèm `@Inject('X') private x: any`.
- `@Inject(TOKEN)` với token chuỗi mất kiểm tra: dùng class token hoặc `InjectionToken` có kiểu.
- Guard/interceptor: `ExecutionContext.switchToHttp().getRequest<T>()` là hợp đồng framework; kiểm tra trước khi dùng (xem boundaries).

## Cạm bẫy

- Union thiếu discriminant (`string` thay vì literal) nên không thu hẹp được.
- Guard viết lỏng (`return true`) hoặc chỉ kiểm một phần field.
- `Partial<T>` rồi dùng như `T` sau khi gán.
- Dùng enum số/string TS cho dữ liệu đi qua mạng mà không có guard (giá trị lạ lọt vào).
- Kiểu trả về suy luận làm lộ `any`.
