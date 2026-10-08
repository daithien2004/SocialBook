---
name: nestjs-type-safety-boundaries
description: Cách đưa dữ liệu từ bên ngoài vào code NestJS/TypeScript có kiểu đúng mà không cast - DTO và ValidationPipe, WebSocket payload, Socket.IO generic events và socket.data, JWT payload, Redis và JSON.parse, biến môi trường và ConfigService, kết quả query raw của TypeORM/Prisma, job BullMQ, payload event/outbox, catch với e kiểu unknown, thư viện trả any. Dùng skill này bất cứ khi nào xử lý dữ liệu không do compiler kiểm chứng, hoặc thấy as/any quanh req.user, socket.data, jwt.verify, redis.get, process.env, configService.get, JSON.parse, query().  Also use for runtime validation vs compile-time types, type guards, parse don't validate, typed Socket.IO in NestJS, typed config in NestJS.
---

# Type Safety: xác thực tại biên

Nguyên tắc: mọi dữ liệu đi qua ranh giới process (HTTP, WS, Redis, DB raw, queue, env, file, thư viện bên thứ ba) là **`unknown`** cho đến khi được xác thực. Xác thực **một lần ở biên**, bên trong hệ thống tin vào type đã được xác thực. Cast là cách **bỏ qua** bước xác thực đó.

Type của TypeScript bị xóa lúc chạy. `interface`/`type` **không** kiểm tra gì. Muốn kiểm tra thật cần mã chạy được (class + decorator, type guard, hoặc thư viện schema nếu dự án đã có).

Tiền đề: `nestjs-type-safety-core`.

## 0. Bộ guard dùng chung

Đặt ở `src/shared/typing/guards.ts` (không dùng cast, không cần thư viện):

```ts
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

export const hasStringProp = <K extends string>(v: unknown, key: K): v is Record<K, string> =>
  isRecord(v) && typeof v[key] === 'string';

// TS >= 5.0 cho `const` type parameter. Bản cũ hơn: truyền mảng đã `as const` ở nơi gọi.
export const isOneOf =
  <const T extends readonly string[]>(values: T) =>
  (v: unknown): v is T[number] =>
    typeof v === 'string' && values.some((x) => x === v);

export const isArrayOf =
  <T>(guard: (v: unknown) => v is T) =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(guard);

export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
export const errorStack = (e: unknown): string | undefined => (e instanceof Error ? e.stack : undefined);
```

Ví dụ: `export const isErrorCode = isOneOf(Object.values(ErrorCode));`

## 1. HTTP/WS DTO (class-validator)

```ts
export class JoinRoomDto {
  @IsString() @Length(4, 12)
  roomCode!: string;          // definite assignment: hợp lệ cho DTO/entity, xem ghi chú dưới

  @IsOptional() @ValidateNested({ each: true }) @Type(() => DeviceDto)
  devices?: DeviceDto[];
}

@Post('join')
join(@Body() dto: JoinRoomDto) { ... }                 // KHÔNG: @Body() body: any
```

- DTO phải là **class** (interface bị xóa lúc chạy nên `ValidationPipe` không có gì để kiểm tra).
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`; WS dùng pipe riêng (xem `nestjs-error-catalog`).
- `roomCode!: string` là **definite assignment assertion** của property, khác với `x!` (non-null assertion biểu thức). Đây là cách chuẩn cho DTO/entity vì `strictPropertyInitialization` không biết decorator/ORM sẽ gán. Chỉ dùng cho DTO, entity, `@WebSocketServer()`. Không dùng cho class nghiệp vụ.
- Lồng nhau cần `@ValidateNested()` + `@Type(() => X)`; thiếu thì không được kiểm tra.
- `@Query()`/`@Param()` luôn là string: dùng `ParseIntPipe`, `ParseUUIDPipe`, hoặc DTO với `@Type(() => Number)`.

## 2. Người dùng đã xác thực: `@CurrentUser()`

```ts
export interface AuthUser { id: string; role: Role }
export interface AuthenticatedRequest extends Request { user?: AuthUser }

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!req.user) throw new UnauthorizedException();     // guard là nơi duy nhất gán req.user
  return req.user;
});
```

`getRequest<T>()` là hợp đồng của framework (generic không kiểm chứng), chấp nhận được **vì** có kiểm tra `req.user` ngay sau đó và guard là nơi duy nhất gán nó. Không viết `req.user as AuthUser` ở controller.

## 3. Socket.IO có kiểu

```ts
export interface ServerToClientEvents {
  'presence:update': (presences: PresenceDto[]) => void;
  error: (e: ErrorPayload) => void;
}
export interface ClientToServerEvents { /* khai báo event client gửi lên */ }
export interface InterServerEvents { ping: () => void }
export interface SocketData { userId: string; role: Role; displayName?: string; roomId?: string }

export type RoomSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type RoomNamespace = Namespace<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

afterInit(server: RoomNamespace) { ... }
handleDisconnect(socket: RoomSocket) { const { userId } = socket.data; ... }
```

- Có generic thì `socket.data.userId` và `emit('presence:update', ...)` được kiểm tra, không cần `as SocketData`.
- Trung thực với trạng thái: field chỉ có sau khi join là `roomId?` (optional), field chắc chắn có sau handshake là bắt buộc. Việc "chắc chắn có" được bảo đảm bởi **đúng một nơi**: middleware xác thực gán `socket.data` từ dữ liệu đã xác thực.
- Handler `@SubscribeMessage` của Nest **không** tự nối với `ClientToServerEvents`; payload vẫn phải qua DTO + pipe.

## 4. JWT

`verifyAsync<T>()` mặc định trả `any` và generic **không xác thực** gì. Bắt vào `unknown` rồi dùng guard:

```ts
interface AccessTokenPayload { sub: string; iat: number; role: Role; displayName?: string }

const isAccessTokenPayload = (v: unknown): v is AccessTokenPayload =>
  isRecord(v) &&
  isNonEmptyString(v.sub) &&
  typeof v.iat === 'number' &&
  isRole(v.role);

const raw: unknown = await this.jwt.verifyAsync(token, { algorithms: ['HS256'] });
if (!isAccessTokenPayload(raw)) throw new AuthException(ErrorCode.UNAUTHORIZED);
// từ đây raw là AccessTokenPayload
```

Chữ ký hợp lệ chỉ chứng minh token do bạn phát hành, **không** chứng minh payload đúng hình dạng (token cũ, đổi phiên bản, bug khi phát hành).

## 5. Redis và JSON

`redis.get` trả `string | null` (đã đúng kiểu). Vấn đề là `JSON.parse` trả `any`:

```ts
export function readJson<T>(raw: string | null, guard: (v: unknown) => v is T): T | null {
  if (raw === null) return null;
  let parsed: unknown;                       // annotate unknown ngay khi bắt giá trị any
  try { parsed = JSON.parse(raw); } catch { return null; }
  return guard(parsed) ? parsed : null;
}

const presence = readJson(await redis.get(key), isPresenceData);   // PresenceData | null
```

- Giá trị sai hình dạng → `null` (và log ở nơi gọi nếu đáng quan tâm). Không đoán.
- `redis.multi().exec()` trả mảng `[error, result]` với `result: unknown`: thu hẹp từng phần tử, hoặc đọc `Number(x)` rồi kiểm `Number.isFinite`.

## 6. Biến môi trường và config

```ts
// shared/config/env.ts
export const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (v === undefined || v === '') throw new Error(`Missing required env: ${name}`);
  return v;
};
export const intEnv = (name: string, fallback?: number): number => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    if (fallback === undefined) throw new Error(`Missing required env: ${name}`);
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Env ${name} must be an integer, got "${raw}"`);
  return n;
};

// config/app.config.ts
export const appConfig = registerAs('app', () => ({
  port: intEnv('PORT', 3000),
  jwtSecret: requireEnv('JWT_SECRET'),
  maxConnectionsPerUser: intEnv('MAX_CONN_PER_USER', 5),
}));

// dùng
constructor(@Inject(appConfig.KEY) private readonly cfg: ConfigType<typeof appConfig>) {}
// this.cfg.port: number, this.cfg.jwtSecret: string, không cast
```

Hỏng cấu hình thì **sập lúc khởi động** với thông điệp rõ, không phải chạy với `undefined`. Tránh `configService.get<string>('X')` (generic không kiểm chứng, trả `string | undefined`); nếu bắt buộc dùng `ConfigService`, dùng `getOrThrow`.

## 7. Query raw, query builder, ORM

- `dataSource.query()` trả `any`; `getRawMany<T>()` không kiểm chứng `T`. Bắt vào `unknown`, ánh xạ qua hàm mapper có guard:

```ts
const rows: unknown = await manager.query('SELECT id, name, version FROM rooms WHERE code = $1', [code]);
if (!isArrayOf(isRoomRow)(rows)) throw new Error('Unexpected rooms query shape');
return rows.map(toRoom);            // toRoom(row: RoomRow): Room, ánh xạ từng field
```

- Mapper từ row sang domain **ánh xạ từng field**, không spread, không `as`.
- Ưu tiên API có kiểu của ORM (entity, `select` có kiểu, Prisma client) hơn raw SQL; raw SQL chỉ khi cần, kèm guard.

## 8. Job queue (BullMQ) và event/outbox

- Payload job được serialize và có thể đến từ phiên bản code cũ: processor nhận `unknown`, kiểm bằng guard rồi mới dùng. `Queue<JobData>` generic chỉ giúp phía gửi.
- Payload outbox là `jsonb` (`unknown` khi đọc ra). Ánh xạ qua `parseEvent(type, payload)` với **discriminated union theo `type`** và `assertNever` ở nhánh cuối (xem patterns).

## 9. Lỗi (`catch`)

```ts
try { ... } catch (e: unknown) {          // useUnknownInCatchVariables (strict) đã mặc định như vậy
  this.logger.error(errorMessage(e), errorStack(e));
  throw e;
}
```

Không viết `catch (e: any)` hay `(e as Error)`. Thứ bị ném có thể là chuỗi, object, `null`.

## 10. Thư viện trả `any` hoặc kiểu quá rộng

Bao trong **một adapter** chuyển sang kiểu của mình; `any` không được vượt qua adapter:

```ts
class RedisCache implements CachePort {          // adapter là nơi duy nhất biết ioredis
  async get<T>(key: string, guard: (v: unknown) => v is T): Promise<T | null> {
    return readJson(await this.redis.get(key), guard);
  }
}
```

Phần còn lại của app phụ thuộc `CachePort`, không phụ thuộc `Redis`. Cũng làm test dễ hơn (xem testing).

## Cạm bẫy

- Tin generic của thư viện (`verifyAsync<T>`, `getRawMany<T>`, `configService.get<T>`): chúng không kiểm tra.
- DTO là `interface`/`type` (không kiểm tra lúc chạy).
- Quên `@ValidateNested()`/`@Type()` cho DTO lồng nhau.
- Xác thực nhiều lần ở nhiều tầng thay vì một lần ở biên.
- Dùng `!:` cho class nghiệp vụ (chỉ dành cho DTO/entity).
- `socket.data` không có generic nên phải cast.
