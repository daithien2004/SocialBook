---
name: nestjs-cqrs-foundation
description: Nền tảng CQRS mức 2 cho NestJS dùng @nestjs/cqrs (CommandBus, QueryBus, CommandHandler, QueryHandler) theo chuẩn production. Dùng skill này bất cứ khi nào người dùng viết hoặc review command, query, handler, nhắc đến CommandBus, QueryBus, @CommandHandler, @QueryHandler, "use case", "interactor", chuyển từ use case class sang bus, cấu trúc thư mục application layer, gateway/controller gọi use case, hoặc hỏi nên thiết kế command/query thế nào để scale. Also use for NestJS CQRS design, handler conventions, thin controller/gateway, DDD application layer, migrating UseCase.execute to CommandBus.
---

# NestJS CQRS Foundation (mức 2: bus + handler)

Mức 2 = gateway/controller gửi **message** (Command/Query) qua bus, bus tìm handler. Đây **chưa** phải CQRS đầy đủ (không tách store đọc/ghi). Bus không làm hệ thống nhanh hơn, nó chỉ tách nơi gọi khỏi nơi xử lý và tạo một điểm để gắn logic chung.

Bộ skill này gồm 4 phần, đọc theo nhu cầu:

| Skill | Dùng khi |
|---|---|
| `nestjs-cqrs-foundation` (file này) | Viết command/query/handler, wiring, quy ước |
| `nestjs-cqrs-pipeline` | Log, metrics, transaction, retry, idempotency, request context |
| `nestjs-cqrs-events-outbox` | Domain event, outbox, projector, event handler |
| `nestjs-cqrs-testing-ops` | Test, kiểm tra kiến trúc, checklist lên production |

## Kiểm tra trước khi bắt đầu

1. Phiên bản `@nestjs/cqrs` đang cài (`npm ls @nestjs/cqrs`). `Command<T>`/`Query<T>` (suy kiểu kết quả) và `CqrsModule.forRoot()` có ở các bản gần đây (v10.x trở lên, v11 là bản hiện hành). Bản cũ hơn dùng `ICommand` và `execute<T, R>()`. Điều chỉnh code mẫu theo bản đang dùng.
2. Dự án đã có error catalog (`DomainException`, `ErrorCode`) chưa? Có skill `nestjs-error-catalog`. Handler **ném** `DomainException`, filter xử lý.
3. Dự án có UnitOfWork/transaction abstraction chưa? Nếu chưa, xem `nestjs-cqrs-pipeline`.

## Luồng

```
Transport (HTTP controller / WS gateway)      <- adapter mỏng
   │  validate (pipe) → lấy actor từ auth context → tạo Command/Query
   ▼
Dispatcher (facade quanh bus, xem skill pipeline)
   ▼
CommandBus / QueryBus ──► Handler (đúng 1 handler / message)
                            │ Command: load aggregate → gọi domain → save → trả DTO nhỏ
                            │ Query:   đọc thẳng read repository → trả DTO
                            ▼
                      Domain (aggregate, quy tắc nghiệp vụ)   Infrastructure (repo, cache)
```

## Cài đặt và wiring

```ts
// app.module.ts (gọi forRoot một lần duy nhất)
@Module({ imports: [CqrsModule.forRoot(), ReadingRoomsModule] })
export class AppModule {}

// reading-rooms.module.ts
export const CommandHandlers = [JoinRoomHandler, LeaveRoomHandler];
export const QueryHandlers = [GetRoomPresencesHandler, ListMyRoomsHandler];

@Module({
  providers: [...CommandHandlers, ...QueryHandlers /* repos, services */],
})
export class ReadingRoomsModule {}
```

Handler **bắt buộc** nằm trong `providers`, nếu không bus báo `CommandHandlerNotFoundException` lúc chạy (không báo lúc build). Dùng mảng `CommandHandlers`/`QueryHandlers` để test kiểm tra được (xem `nestjs-cqrs-testing-ops`).

## Cấu trúc thư mục

```
src/application/reading-rooms/
├── commands/
│   └── join-room/
│       ├── join-room.command.ts
│       ├── join-room.handler.ts
│       └── join-room.handler.spec.ts
├── queries/
│   └── list-my-rooms/
│       ├── list-my-rooms.query.ts
│       └── list-my-rooms.handler.ts
├── ports/                       # abstract class làm DI token
│   ├── reading-room.repository.ts   # ghi: trả aggregate
│   └── room-read.repository.ts      # đọc: trả DTO
└── reading-rooms.module.ts
```

Mỗi command/query một thư mục riêng. Tên: `Động từ + Danh từ + Command` (`JoinRoomCommand`), `Get/List... + Query`, handler `...Handler`. Event ở thì quá khứ (`RoomJoinedEvent`).

## Command

Bất bại, chỉ chứa dữ liệu thô (id, string, number), **không** chứa entity, **không** gắn decorator `class-validator` (validate ở tầng transport).

```ts
export interface JoinRoomResult {   // DTO nhỏ cho ack/response
  roomId: string;
  name: string;
}

export class JoinRoomCommand extends Command<JoinRoomResult> {
  constructor(
    public readonly userId: string,     // luôn từ auth context, không từ payload client
    public readonly roomCode: string,   // dữ liệu client, đã qua validation pipe
  ) {
    super();
  }
}
```

Kết quả của command là `void`, id, hoặc DTO nhỏ. **Không trả aggregate/entity ra khỏi application layer.**

## Command handler

```ts
@CommandHandler(JoinRoomCommand)
export class JoinRoomHandler
  implements ICommandHandler<JoinRoomCommand, JoinRoomResult>
{
  constructor(
    private readonly rooms: ReadingRoomRepository,   // port (abstract class)
    private readonly uow: UnitOfWork,                // xem nestjs-cqrs-pipeline
  ) {}

  async execute({ userId, roomCode }: JoinRoomCommand): Promise<JoinRoomResult> {
    return this.uow.run(async () => {
      const room = await this.rooms.findByCode(roomCode);
      if (!room) throw new RoomNotFoundException(roomCode);

      room.join(userId);              // quy tắc nghiệp vụ nằm trong aggregate; đã ở trong phòng => no-op
      await this.rooms.save(room);    // optimistic lock; ghi outbox cùng transaction nếu có event
      return { roomId: room.id, name: room.name };
    });
  }
}
```

Handler chỉ **điều phối**: load → gọi domain → save → map DTO. Quy tắc nghiệp vụ ở aggregate/domain service. Không biết socket, `req`, `res`, HTTP status.

## Query và query handler

```ts
export class ListMyRoomsQuery extends Query<Page<RoomListItemDto>> {
  constructor(
    public readonly userId: string,
    public readonly cursor?: string,
    public readonly limit: number = 20,
  ) {
    super();
  }
}

@QueryHandler(ListMyRoomsQuery)
export class ListMyRoomsHandler
  implements IQueryHandler<ListMyRoomsQuery, Page<RoomListItemDto>>
{
  constructor(private readonly reads: RoomReadRepository) {}

  execute({ userId, cursor, limit }: ListMyRoomsQuery) {
    return this.reads.listByUser(userId, { cursor, limit: Math.min(limit, 100) });
  }
}
```

Quy tắc query: không side effect, không load aggregate, đọc thẳng read repository (SQL tối ưu, projection, cache) và trả DTO. **Mọi query trả danh sách phải phân trang** (ưu tiên cursor/keyset, không dùng OFFSET lớn) và có giới hạn trần.

## Transport adapter

```ts
@WebSocketGateway({ namespace: 'reading-room' })
@UseFilters(WsExceptionFilter)
@UsePipes(WsValidationPipe)
export class ReadingRoomGateway {
  constructor(private readonly bus: Dispatcher) {}   // facade, không inject CommandBus trực tiếp

  @SubscribeMessage(ClientEvent.JOIN_ROOM)
  async join(@ConnectedSocket() socket: RoomSocket, @MessageBody() dto: JoinRoomDto) {
    const room = await this.bus.command(
      new JoinRoomCommand(socket.data.userId, dto.roomCode),
    );
    await socket.join(Rooms.room(room.roomId));
    return { ok: true, data: room };
  }
}
```

Adapter chỉ làm: parse → tạo message → gọi → map kết quả sang ack/response. Có `if` nghiệp vụ trong adapter nghĩa là nó thuộc về handler/domain. Chưa có `Dispatcher` thì tạm inject `CommandBus`/`QueryBus`, rồi chuyển khi làm skill pipeline.

## Lỗi

- Handler **ném** `DomainException` (có `ErrorCode`), không trả `{ error }`, không `catch` rồi nuốt.
- Lỗi trong command/query handler đi lên transport và được exception filter xử lý bình thường.
- Lỗi trong **event handler** thì **không** đi qua filter (xem `nestjs-cqrs-events-outbox`).

## Request context

**Không dùng handler request-scoped.** `@nestjs/cqrs` hỗ trợ (tạo instance handler mới cho mỗi lần dispatch) nhưng nó làm cả cây dependency thành request-scoped, tốn tài nguyên và khó debug. Thay bằng:

- Truyền dữ liệu cần thiết **tường minh trong command** (`userId`, `tenantId`).
- Dữ liệu xuyên suốt (correlation id, actor cho log) dùng `AsyncLocalStorage` (xem `nestjs-cqrs-pipeline`).

## Quy tắc cứng

| # | Quy tắc |
|---|---|
| 1 | Một command/query = đúng một handler |
| 2 | Command không trả aggregate/entity |
| 3 | Handler **không** gọi `commandBus.execute` sang handler khác (không chuỗi). Dùng domain service hoặc domain event |
| 4 | `userId`/`tenantId` lấy từ context đã xác thực, **không** từ payload client |
| 5 | Query không side effect, luôn phân trang, có giới hạn trần |
| 6 | Không handler request-scoped |
| 7 | Handler không biết transport (socket, req, res, status code) |
| 8 | Domain layer không import `@nestjs/cqrs` (xem skill events-outbox) |
| 9 | Command/Query không mang decorator validation, validate ở pipe |
| 10 | Mỗi handler có unit test chạy không cần bus |

## Khi KHÔNG nên dùng bus

- Gateway/controller chỉ có vài use case và chưa cần logic chung: use case class gọi trực tiếp đã đủ, dễ đọc hơn.
- Đổi qua bus chỉ vì "giống production hơn" thì không đủ lý do.

## Chuyển từ UseCase class sang bus

Xem `references/migration-from-usecase.md`.
