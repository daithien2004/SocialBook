## Type safety (bắt buộc)

Dự án này cấm "ép kiểu cho qua". Compiler và lint là nguồn sự thật; không hạ chuẩn chúng.

### Cấm tuyệt đối trong `src/` (trừ file ngoại lệ bên dưới)

- `as any`, `: any`, `<any>`, `Function`/`object`/`{}` làm kiểu wildcard
- `as T`, `as unknown as T`, `<T>x`, `{} as T`, `JSON.parse(x) as T`
- `x!` (non-null assertion biểu thức)
- `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`
- `eslint-disable` cho bất kỳ rule `@typescript-eslint/*` nào liên quan đến type
- `catch (e: any)`, `(e as Error)`

Được phép: `as const`, `satisfies`, type annotation, generics, type guard (`x is T`), `name!: string` trên **property của DTO/entity/@WebSocketServer** (definite assignment).

### Khi `tsc` hoặc ESLint báo lỗi type

Làm theo thứ tự, dừng ở bước đầu tiên giải quyết được:

1. Tìm **nguồn** của lỗi (type khai báo sai? dữ liệu có thể sai lúc chạy? thư viện trả kiểu rộng?).
2. Sửa khai báo ở nguồn.
3. Thu hẹp: `typeof`/`instanceof`/`in`/kiểm tra `null`/discriminated union/type guard.
4. Dữ liệu từ ngoài (HTTP, WS, JWT, Redis, JSON, env, query raw, job, event payload) là `unknown` cho đến khi được xác thực ở **biên**: DTO class + ValidationPipe, type guard, `readJson`, `requireEnv`, `registerAs`.
5. Mô hình hóa lại: generics có ràng buộc, overload, `satisfies`, interface hẹp.
6. Đổi thiết kế (thêm nhánh `null`, ném exception có nghĩa).
7. Escape hatch: chỉ khi đủ 5 điều kiện (xem skill `nestjs-type-safety-core`), chỉ trong `src/shared/typing/unsafe.ts` hoặc `test/support/typed-fake.ts`, có `@reason` + test, và **báo cáo cho người dùng**.

Không bao giờ đổi `as T` thành `as unknown as T`. Không thêm `| undefined`/`?` để im lỗi mà không xử lý. Không sửa `tsconfig.json`, `eslint.config.mjs`, hay `eslint-suppressions.json` để làm lỗi biến mất. Cần đổi cấu hình thì hỏi người dùng.

### Test

- Không `as any`, `as unknown as jest.Mocked<X>`, `{} as Entity`.
- Dùng fake class kế thừa/cài port, interface hẹp, builder gọi factory thật, `jest.fn` suy kiểu từ cài đặt.
- Không truy cập private qua cast; test qua public API.

### Trước khi báo "xong"

- Chạy `npm run check` (typecheck + lint + test) và báo kết quả.
- Báo cáo mọi type assertion mới (nếu có) theo mẫu: vị trí, vì sao không tránh được, vì sao an toàn, đã thử gì, test nào.
- Không tăng số mục trong `eslint-suppressions.json`.

### Khi bí

Dừng lại và hỏi, kèm: lỗi gốc, 2 đến 3 phương án, đánh đổi. Không cast "tạm".
