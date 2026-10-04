---
name: nestjs-error-catalog
description: Thiết kế và refactor xử lý lỗi tập trung cho NestJS (DomainException, WsException filter, HTTP exception filter, error code, error message, i18n) theo hướng error catalog key theo code, message mặc định lấy từ catalog. Dùng skill này bất cứ khi nào người dùng nhắc đến exception filter, hardcode error message, gom code với message, DomainException, ConcurrencyException, WebSocket gateway error, ack callback lỗi, mapping lỗi domain sang HTTP/WS, hoặc hỏi "message lỗi để đâu cho đúng / scale thế nào", kể cả khi họ không nói "error catalog". Also use for NestJS error handling architecture, centralizing error codes and messages, clean architecture / DDD exception design.
---

# NestJS Error Catalog

Mục tiêu: **một nguồn sự thật duy nhất cho `code` và `message` của lỗi**. Filter (WS/HTTP/RPC) chỉ chuyển exception thành payload, không biết gì về từng loại lỗi cụ thể.

Quy ước cốt lõi: `DomainException` gọi `super(message ?? ERROR_MESSAGES[code])`. Vì vậy **`exception.message` chính là câu gửi cho client**, filter dùng trực tiếp.

## Dấu hiệu code cần refactor

- Filter có `instanceof XxxException` chỉ để đổi message.
- Message hardcode trong filter hoặc rải trong từng `throw new ...('chuỗi')`.
- Nhiều filter (HTTP, WS) sao chép bảng message của nhau.
- Thêm loại lỗi mới buộc phải sửa filter (vi phạm Open/Closed).
- Có 2 nguồn message (exception tự mang vs filter override), không rõ cái nào chuẩn.
- Khối `catch {}` rỗng nuốt lỗi khi `ack`/`emit`.

## Nguyên tắc thiết kế

1. **`code` là định danh ổn định**, là hợp đồng với client. Không đổi tên code đã public.
2. **Exception khai báo `code`.** Message mặc định tra từ catalog; chỉ truyền `message` riêng khi thật sự cần câu khác.
3. **Tham số động (id, giới hạn...) đi vào `details`**, không nối vào `message`.
4. **Không nhét thông tin nội bộ (id, SQL, stack) vào `message`**, vì nó được gửi nguyên cho client.
5. **Filter không `instanceof` theo từng lỗi cụ thể.** Chỉ phân loại: `DomainException` / `WsException` / `HttpException` / lỗi không xác định.
6. **Lỗi không xác định không lộ message gốc ra client.** Log đầy đủ ở server, trả `INTERNAL_ERROR` chung.
7. **Catalog dùng `Record<ErrorCode, string>`** để thêm code mà quên message sẽ lỗi compile.
8. **Payload thống nhất** giữa các transport: `{ code, message, data? }`.

## Cấu trúc file

Catalog nằm ở `shared/domain` vì `DomainException` cần import nó.

```
src/shared/
├── domain/
│   ├── error-codes.ts
│   ├── error-messages.ts
│   ├── domain-exception.base.ts
│   └── common-exceptions.ts      # ConcurrencyException, ...
└── presentation/
    ├── error-normalizer.ts
    └── filters/
        ├── ws-exception.filter.ts
        └── http-exception.filter.ts
```

Đánh đổi: domain biết câu chữ mặc định (tiếng Việt). Chấp nhận được với đa số project. Nếu cần domain hoàn toàn không biết text hiển thị, xem mục cuối.

## Template

### 1. Error codes

```ts
// shared/domain/error-codes.ts
export const ErrorCode = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  WS_ERROR: 'WS_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONCURRENCY_CONFLICT: 'CONCURRENCY_CONFLICT',
  // thêm code mới ở đây, nhóm theo bounded context
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

### 2. Catalog

```ts
// shared/domain/error-messages.ts
import { ErrorCode } from './error-codes';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_ERROR]: 'Lỗi hệ thống, vui lòng thử lại sau',
  [ErrorCode.WS_ERROR]: 'Lỗi kết nối realtime',
  [ErrorCode.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ',
  [ErrorCode.CONCURRENCY_CONFLICT]:
    'Dữ liệu vừa thay đổi từ người dùng khác, vui lòng thử lại',
};

// Tra message cho code dạng string tự do (vd code đến từ WsException payload)
export const messageOf = (code: string, fallback?: string): string =>
  (ERROR_MESSAGES as Record<string, string>)[code] ??
  fallback ??
  ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR];
```

### 3. Base exception

```ts
// shared/domain/domain-exception.base.ts
import { ErrorCode } from './error-codes';
import { ERROR_MESSAGES } from './error-messages';

export abstract class DomainException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,              // override khi cần câu riêng cho client
    public readonly details?: unknown,
  ) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = new.target.name;
  }
}

// shared/domain/common-exceptions.ts
export class ConcurrencyException extends DomainException {
  constructor(details?: unknown) {
    super(ErrorCode.CONCURRENCY_CONFLICT, undefined, details);
  }
}

// ví dụ exception có tham số
export class RoomNotFoundException extends DomainException {
  constructor(roomId: string) {
    super(ErrorCode.ROOM_NOT_FOUND, undefined, { roomId });
  }
}
```

### 4. Normalizer dùng chung

```ts
// shared/presentation/error-normalizer.ts
import { HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { DomainException } from '@/shared/domain/domain-exception.base';
import { ErrorCode } from '@/shared/domain/error-codes';
import { ERROR_MESSAGES, messageOf } from '@/shared/domain/error-messages';

export interface NormalizedError {
  code: string;
  message: string;
  data?: unknown;
  isSystemError: boolean;
}

export function normalizeError(e: unknown): NormalizedError {
  if (e instanceof DomainException) {
    return {
      code: e.code,
      message: e.message,          // đã là message từ catalog (hoặc override)
      data: e.details,
      isSystemError: false,
    };
  }

  if (e instanceof WsException) {
    const p = e.getError();
    const obj = typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : {};
    const code = typeof obj.code === 'string' ? obj.code : ErrorCode.WS_ERROR;
    // Tránh bẫy: object không có field message => e.message === 'Ws Exception'
    const message =
      typeof obj.message === 'string'
        ? obj.message
        : typeof p === 'string'
          ? p
          : messageOf(code);
    return {
      code,
      message,
      data: Array.isArray(obj.errors) ? obj.errors : undefined,
      isSystemError: false,
    };
  }

  if (e instanceof HttpException) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: messageOf(ErrorCode.VALIDATION_ERROR, e.message),
      isSystemError: false,
    };
  }

  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR],
    isSystemError: true,
  };
}
```

### 5. WS filter chỉ còn phần transport

```ts
@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    const args = host.getArgs<unknown[]>();
    const last = args[args.length - 1];
    const ack = typeof last === 'function' ? last : undefined;

    const { code, message, data, isSystemError } = normalizeError(exception);
    const logCtx = {
      userId: client?.data?.userId,
      socketId: client?.id,
      event: typeof ctx.getPattern === 'function' ? ctx.getPattern() : 'unknown',
      code,
    };

    if (isSystemError) {
      const err = exception instanceof Error ? exception : null;
      this.logger.error({ ...logCtx, err: err?.message ?? String(exception) }, err?.stack);
    } else {
      // log kèm details vì message không chứa ngữ cảnh debug
      const details = exception instanceof DomainException ? exception.details : undefined;
      this.logger.debug({ ...logCtx, details });
    }

    const payload = { code, message, data };
    try {
      if (ack) ack({ ok: false, error: payload });
      else client?.emit?.(ReadingRoomServerEvent.ERROR, payload);
    } catch (sendErr) {
      this.logger.debug({ ...logCtx, sendErr: String(sendErr) }, 'Failed to deliver error to client');
    }
  }
}
```

HTTP filter, map status và i18n: xem `references/http-and-i18n.md`.

## Quy trình refactor

Làm dần, không big-bang:

1. Tạo `ErrorCode` và `ERROR_MESSAGES` từ các message đang hardcode trong filter.
2. Sửa `DomainException` thành `super(message ?? ERROR_MESSAGES[code])`. Nếu `code` hiện là string tự do, tạm để `ErrorCode | string` rồi siết dần.
3. Chuyển `normalize` cũ sang `normalizeError`, xóa các nhánh `instanceof` đặc thù (như `ConcurrencyException`).
4. Sửa từng exception về dạng chỉ-có-code. Mỗi exception một commit nhỏ.
5. Rà các chỗ `throw` đang truyền message có thông tin nội bộ, chuyển phần đó sang `details`.
6. Thay `catch {}` rỗng bằng log debug.
7. Thêm test.

## Test nên có

- `new ConcurrencyException().message === ERROR_MESSAGES[CONCURRENCY_CONFLICT]`.
- Truyền `message` override thì `exception.message` là chuỗi override.
- `normalizeError(new Error('db password leaked'))` trả `INTERNAL_ERROR`, `isSystemError = true`, message **không chứa** chuỗi gốc.
- `WsException` dạng string, dạng `{ code, message }`, và dạng `{ code }` không có message (không được ra `'Ws Exception'`).
- Filter gọi `ack` khi có callback, `emit` khi không.

## Cạm bẫy

- Nhét chi tiết nội bộ vào `message` rồi vô tình gửi cho client.
- Đổi giá trị `code` đã public khiến client vỡ.
- Nối tham số vào message thay vì dùng `details`.
- Mỗi filter một catalog riêng thay vì dùng chung.
- Log không có `details` nên mất ngữ cảnh debug.

## Nếu cần domain không biết text hiển thị

Chuyển `ERROR_MESSAGES` sang `presentation`, `DomainException` chỉ gọi `super(message ?? code)`, và `normalizeError` dùng `messageOf(e.code)` thay vì `e.message`. Khi đó `exception.message` chỉ để debug. Chọn một trong hai hướng, đừng trộn.
