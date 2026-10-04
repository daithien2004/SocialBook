# Findings (Phase 0) — ReadingRoomGateway

> Nguồn: đọc trực tiếp mã nguồn tại `backend/` (commit `3236e59e` + work-in-progress của
> task hardening). Mỗi khẳng định đều kèm `path:dòng`.
>
> Lưu ý: bản Phase 0 đầu tiên của agent trước có **4 giả định sai** (Q2, Q3, Q9, Q10 về
> định dạng id). Mục "Sai lệch đã sửa" ở cuối liệu kê và mức độ ảnh hưởng tới từng task.

---

## Q1 — Các use case có kiểm tra người gọi là thành viên/host của phòng không?

| Use case | Có kiểm tra? | Bằng chứng |
|---|---|---|
| `AddHighlightUseCase` | Có — `room.isMember(userId)` → `ForbiddenDomainException` | `application/reading-rooms/use-cases/add-highlight/add-highlight.use-case.ts:40` |
| `RemoveHighlightUseCase` | Gián tiếp — `room.removeHighlight(id, userId)` kiểm tra tác giả trong entity | `.../remove-highlight/remove-highlight.use-case.ts:28` + `domain/reading-rooms/entities/reading-room.entity.ts:287` |
| `ChangeChapterUseCase` | Có — `isMember` + host-only khi mode `sync` | `.../change-chapter/change-chapter.use-case.ts:37,42` |
| `ChangeRoomModeUseCase` | Có — host-only (`userId !== room.hostId`) | `.../change-room-mode/change-room-mode.use-case.ts:35` |
| `EndRoomUseCase` | Có — `room.isHost(userId)` | `.../end-room/end-room.use-case.ts:28` |
| `DeleteRoomUseCase` | Có — `room.isHost(userId)` | `.../delete-room/delete-room.use-case.ts:29` |
| `LeaveRoomUseCase` | Có — `room.isMember(userId)` | `.../leave-room/leave-room.use-case.ts:29` |
| `GenerateHighlightInsightUseCase` | Có — `room.isMember(userId)` | `.../generate-highlight-insight/generate-highlight-insight.use-case.ts:57` |

**Kết luận:** lớp phòng thủ sâu đã có đầy đủ. Gateway vẫn phải kiểm tra `isInRoom` (F2) vì
đây là lớp rẻ hơn và chặn broadcast sai — nhưng **không được xoá kiểm tra trong use case**.

---

## Q2 — `main.ts` / adapter: Redis adapter, IoAdapter tùy chỉnh, `enableShutdownHooks()`?

**Sai lệch — giả định cũ nói "không có Redis adapter" là ĐÚNG về hành vi nhưng SAI về mã nguồn.**

- `@socket.io/redis-adapter@^8.3.0` **đã có** trong `package.json` và **đã được dùng**:
  - Adapter: `backend/src/presentation/gateways/redis-io.adapter.ts:1-61` (`RedisIoAdapter extends IoAdapter`, `createAdapter(pubClient, subClient)` từ client `redis` v5, dùng `pubClient.duplicate()` cho sub).
  - Gắn vào app: `backend/src/main.ts:96-100` (`new RedisIoAdapter(app)` → `connectToRedis` → `app.useWebSocketAdapter`).
  - Có `perMessageDeflate: false` và instrument Admin UI khi `SOCKET_ADMIN_UI=true`.
- Có `IoAdapter` tùy chỉnh (chính là `RedisIoAdapter`).
- `app.enableShutdownHooks()` **đã có**: `backend/src/main.ts:172`.
- **Chưa có**: `allowRequest` (Origin allowlist ở tầng HTTP), `requestsTimeout` cho adapter,
  `fetchSockets`/`disconnectSockets` bọc try/catch.

→ **T7 không cần thêm dependency.** Chỉ cần gia cố adapter + bọc lỗi. Việc cộng
`@socket.io/redis-adapter` trong kế hoạch ban đầu là thừa.

---

## Q3 — `ReadingRoomPresenceService`: key, cấu trúc, TTL, hành vi

| Mục | Giá trị thật | Bằng chứng |
|---|---|---|
| Key user | `presence:{roomId}:{userId}` (string, JSON) | `infrastructure/cache/presence-cache.adapter.ts:15-17` |
| Key index | `room:members:{roomId}` (SET userId) | `infrastructure/cache/presence-cache.adapter.ts:19-21` |
| Payload | `PresenceData { userId, displayName, avatarUrl, currentChapterSlug, paragraphId?, progress?, lastSeen }` | `domain/reading-rooms/interfaces/presence-cache.port.ts:1-9` |
| TTL key user | `setex(..., 30)` → 30 giây | `infrastructure/cache/presence-cache.adapter.ts:38` |
| TTL key index | `expire(..., 3600)` → 1 giờ | `infrastructure/cache/presence-cache.adapter.ts:40` |
| `upsertPresence` | ghi đè key user + `sadd` index | `...:23-48` |
| `getRoomPresences` | `SMEMBERS` → `MGET` → bỏ qua key đã hết hạn và `SREM` chúng | `...:50-87` |
| `removePresence` | `DEL` key user + `SREM` index | `...:89-101` |
| `removeRoomPresences` | đọc index rồi `DEL` hàng loạt + `DEL` index | `...:103-118` |

**Khoá quan trọng (F3/F4):** đơn vị lưu trữ là `(roomId, userId)`, **không phải theo socket**
→ đóng một tab sẽ xoá presence dù tab khác vẫn còn. Đây chính là F4.
**Toàn bộ method đều nuốt lỗi (`catch` + `logger.error`) → fail-safe**, tức là `clearRoom` mới
không cần bọc try/catch ở caller.

Service wrapper: `application/reading-rooms/presence/reading-room-presence.service.ts:11-29`.

---

## Q4 — `AddHighlightUseCase.execute` trả về gì? Highlight nằm ở đâu? Thứ tự có an toàn?

- Trả về **entity `ReadingRoom`** sau khi `save()`: `.../add-highlight/add-highlight.use-case.ts:50`.
- Highlight nằm trong **aggregate `Room`** (`highlights: RoomHighlightProps[]`):
  `domain/reading-rooms/entities/reading-room.entity.ts:41`, `:98`.
- `addHighlight` **push vào cuối mảng** và id sinh bằng `crypto.randomUUID()`:
  `reading-room.entity.ts:262-263`.
- Thứ tự mảng **không đảm bảo** về mặt concurrency: `withRetries` chạy tối đa 3 lần
  (`add-highlight.use-case.ts:49`, `application/shared/utils/with-retries.util.ts`), mỗi lần
  load lại phòng, `addHighlight`, `save`. Hai user highlight song song → mỗi request có thể
  nhận về `room.highlights` đã bị lượt kia append thêm → `room.highlights[len-1]` có thể trả về
  highlight **của người khác**. Đây chính là F8.

→ T8: dùng `id` mà use case sinh, hoặc thay đổi use case trả về đúng highlight vừa tạo.

---

## Q5 — `WsExceptionFilter` map lỗi nào, phát event nào, có `requestId` không?

`common/filters/ws-exception.filter.ts`:

| Nhánh | `code` | `message` | Dòng |
|---|---|---|---|
| `WsException` với payload `{ code }` | lấy `payload.code` | `exception.message` | `:22-37` |
| `WsException` với payload chuỗi | `WS_ERROR` | `exception.message` | `:34` |
| `HttpException` | `exception.name` | response/message | `:38-44` |
| `ConcurrencyException` | `exception.code` (`CONCURRENCY_CONFLICT`) | chuỗi OCC cố định | `:45-49` |
| `DomainException` | `exception.code` | `exception.message` | `:50-52` |
| object "vịt" tên kết thúc `DomainException` | `code` hoặc `DOMAIN_ERROR` | `message` | `:53-67` |
| `Error` khác | `SERVER_ERROR` | `exception.message` | `:68-74` |
| còn lại | `INTERNAL_ERROR` | `'Lỗi không xác định từ Server'` | `:16-17,75-77` |

- Phát `ReadingRoomServerEvent.ERROR` (`'error'`) với `{ code, message, data }`: `:85-89`.
- **Không có `requestId`** ở đâu cả (grep `requestId` trong `backend/src` → 0 kết quả).
- Log: `logger.warn` có `client.id` + `code` + `message` + `JSON.stringify(data)`: `:80-82`.

→ T12: gom thêm nhánh "duck-typed `code`" của `join_room` vào một `ws-error.mapper.ts`.

---

## Q6 — `WsUser` đọc từ đâu? `SocketData` / `RoomSocket` có field nào?

- `WsUser` = `createParamDecorator` đọc `ctx.switchToWs().getClient<RoomSocket>().data`
  (hoặc `socket.data[field]`): `presentation/gateways/ws-user.decorator.ts:22-26`.
- `SocketData`: `presentation/gateways/reading-room.types.ts:10-28`

| Field | Kiểu | Nguồn | Dòng |
|---|---|---|---|
| `userId` | `string` (**bắt buộc**) | `payload.sub ?? payload.id` | `types:11` / `gateway:180` |
| `role` | `string` (**bắt buộc**) | `payload.role ?? 'user'` | `types:12` / `gateway:204` |
| `displayName?` | `string` | `payload.displayName` | `gateway:205` |
| `avatarUrl?` | `string` | `payload.avatarUrl` | `gateway:206` |
| `roomId?` | `string` | `join_room` | `gateway:456` |
| `bookId?` | `string` | `join_room` | `gateway:457` |
| `verifiedChapters?` | `Map<chapterId, bookId>` | `saveReadingProgress` | `gateway:230-247` |
| `pendingProgress?` | `{ bookId, chapterId, progress }` | `heartbeat` | `gateway:779-783` |
| `progressTimer?` | `NodeJS.Timeout` | `heartbeat` | `gateway:784` |
| `exp?` | `number` | **chưa có** — sẽ thêm ở T5 | — |
| `sessionTimer?` | `NodeJS.Timeout` | **chưa có** — sẽ thêm ở T5 | — |
| `limitTimer?` | `NodeJS.Timeout` | **chưa có** — sẽ thêm ở T4 | — |

- `RoomSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>`: `types:31-36`.

---

## Q7 — `EventNames` có sự kiện ban / logout / đổi mật khẩu không? Ai phát?

- `EventNames` chỉ có `USER_ROLE_CHANGED: 'user.role.changed'` cho vùng user
  (`common/constants/event-names.constant.ts:17`). **Không có** event logout/đổi mật khẩu.
- **Ban/unban đã được phủ**: `ToggleBanUseCase` phát `USER_ROLE_CHANGED` khi bật/tắt ban
  (`application/users/use-cases/toggle-ban/toggle-ban.use-case.ts:35-38`), và gateway đang
  nghe event đó (`gateway:394-410`).
- **Logout tồn tại nhưng không phát event**: `LogoutUseCase` chỉ xoá refresh token +
  `rotationPort.revokeAll()` (`application/auth/use-cases/logout/logout.use-case.ts:15-26`).
- **Không có use case đổi mật khẩu** trong `backend/src/application/auth/use-cases/`.

→ Theo D2: **không tự tạo event mới**. Ghi đề xuất ở "Phát hiện thêm".

### Về process nào phát event (câu hỏi của T7)

- `@OnEvent` của gateway chỉ nhận event phát **trong cùng process** (`@nestjs/event-emitter`
  không có bus phân tán).
- Gateway **có** mặt ở cả API và worker: `PresentationModule` import `GatewaysModule`, và
  `GatewaysModule.providers` khai báo `ReadingRoomGateway` vô điều kiện
  (`presentation/gateways/gateways.module.ts:50`); `worker.ts` cũng nạp `AppModule`.
- `USER_ROLE_CHANGED` chỉ phát từ HTTP endpoint (`ToggleBanUseCase`) → chỉ chạy trên API
  replica → gateway ở worker **không nhận** event này. Không gây sai lệch state.
- **NHƯNG** ở worker, `@WebSocketServer() server` là `undefined` (không có HTTP server),
  nên nếu event tới được thì `this.toRoom(...)` sẽ ném `TypeError`. Phải guard.
- `READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED` phát từ `GenerateHighlightInsightUseCase`
  (`.../generate-highlight-insight.use-case.ts:130`) — nếu T11 chuyển insight sang BullMQ
  thì event sẽ phát ở **process worker**, và gateway của worker không có socket server.
  → Phải định tuyến kết quả về đúng process/namespaces, hoặc phát trực tiếp qua
  `server.to(room)` ở process có socket. Ghi vào DECISIONS.

---

## Q8 — `UpdateProgressUseCase` có kiểm tra chapter thuộc book không?

**Không.** `application/library/use-cases/update-progress/update-progress.use-case.ts:41-147`:
- `bookRepository.findById` chỉ kiểm tra *sách* tồn tại (`:46-51`).
- `chapterRepository.countByBook(...)` chỉ dùng để tính tỉ lệ hoàn thành (`:103`), **không**
  dùng để xác thực `command.chapterId`.
- Không có `findById(chapterId).bookId === bookId` nào.

Vì vậy gateway phải tự xác minh (`saveReadingProgress`, `gateway:230-248`) — và việc xác minh
này **không cache âm**: `verifiedChapters` chỉ ghi khi hợp lệ, nên chapter sai sách sẽ bị tra
cứu DB lại ở **mọi** heartbeat (10s/lần).

→ T15 chuyển xác minh vào `UpdateProgressUseCase` + cache âm ở gateway cho tới khi đó.

---

## Q9 — Phiên bản thư viện; gateway có bị đăng ký ở module khác không?

| Package | Version (`backend/package.json`) |
|---|---|
| `@nestjs/websockets` | `^11.1.6` |
| `@nestjs/platform-socket.io` | `^11.1.6` |
| `socket.io` | (transitive qua platform-socket.io) |
| `socket.io-client` | chỉ dùng trong test (`test/e2e/`) |
| `@nestjs/jwt` | `^11.0.0` |
| `ioredis` | `^5.8.1` |
| `redis` | `^5.12.1` (dùng cho `RedisIoAdapter`) |
| `@socket.io/redis-adapter` | `^8.3.0` |

- `@nestjs/websockets` v11: `WebSocketAdapter` trả `Server | Namespace` tùy decorator có
  `namespace` hay không → **gateway có `namespace: '/reading-rooms'` nên `afterInit(server)`
  nhận `Namespace`**, không phải `Server`. Kiểu hiện tại ghi `Server` là sai (F17).
- Gateway chỉ được khai báo ở `presentation/gateways/gateways.module.ts:50`. Mô tả gateway
  khác (`NotificationsGateway`) dùng chung adapter nhưng khác namespace.

---

## Q10 — Domain giới hạn độ dài `content`, định dạng `roomCode`/`roomId`?

| Trường | Quy tắc domain thật | Bằng chứng |
|---|---|---|
| `roomId` (mã phòng) | `^[A-Z0-9]{6,10}$`, sinh 8 ký tự từ alphabet 31 ký tự | `domain/reading-rooms/value-objects/room-id.vo.ts:5,26,32` |
| `roomCode` (input join) | cùng format, `RoomId.create()` tự `trim().toUpperCase()` | `room-id.vo.ts:13-20` |
| `content` highlight | trim rồi `1..1000` ký tự | `reading-room.entity.ts:230-235` |
| `paragraphId` | `1..100` ký tự | `reading-room.entity.ts:237-241` |
| `chapterSlug` | `^[a-z0-9-]{1,200}$` | `reading-room.entity.ts:243-245` |
| `highlightId` | **`crypto.randomUUID()`** — UUID v4, KHÔNG phải ObjectId | `reading-room.entity.ts:263` |
| giới hạn highlight | 500/phòng, 100/người | `reading-room.entity.ts:247-260` |
| `bookId`, `chapterId`, `userId` | ObjectId 24 hex | `domain/books/value-objects/book-id.vo.ts`, `domain/chapters/value-objects/chapter-id.vo.ts` |

**Sai lệch quan trọng nhất của Phase 0:** `roomId` **không phải ObjectId** mà là mã 6–10 ký
tự chữ/ối. Bộ DTO viết ở work-in-progress đã dùng `OBJECT_ID_PATTERN` cho `roomId` và cho
`highlightId` → **chặn sai toàn bộ event ghi** với client thật. Đã sửa ở T1 (xem cuối file).

---

## Q11 — Có hạ tầng queue trong dự án không?

**Có: BullMQ.**
- Dependency: `@nestjs/bullmq@^11.0.5`, `bullmq@^5.81.5`, `@bull-board/*`.
- Queue đang chạy: `post-moderation` (`infrastructure/queues/post-moderation/`),
  `chapters-import` (`infrastructure/queues/chapters-import/`).
- Khuôn mẫu: port ở domain (`domain/posts/interfaces/post-moderation.port.ts`) → adapter
  `enqueue` dùng `jobId` idempotent + `attempts`/`backoff` → processor `WorkerHost` với
  `@OnWorkerEvent('failed')` làm fallback.
- Bull Board đã mount tại `/queues` (BasicAuth) trong `main.ts:104-168`.
- Worker chạy entry riêng `worker.ts`, và `AppModule` bị **disable offline queue** khi
  `WORKER_MODE=true` (`app.module.ts: BullModule.forRootAsync` → `enableOfflineQueue: isWorker`).

→ Theo D3: **dùng queue cho insight AI** (T11), theo đúng khuôn mẫu trên.

---

## Q12 — Client xử lý reconnect thế nào? Có gọi lại `join_room` không?

**Có.** `frontend/src/features/reading-rooms/hooks/useReadingRoomSocket.ts`:
- `'connect': join` — `:166`.
- `join` emit `join_room` với `{ roomCode }` và chờ ack trong 5s: `:146-163`.
- Unmount → emit `leave_room` với `{ roomId: roomCode, roomCode }`: `:236`.

⇒ **Sau mỗi reconnect socket là `mới`, `socket.data.roomId` trống.** Mọi state trên
`socket.data` phải được `join_room` dựng lại (đúng như hiện tại). Ngược lại, nếu ta giữ
presence theo `socketId` thì socket cũ phải tự hết hạn (đó là lý do TTL ở T6).

### Payload client thật sự gửi (dùng để viết DTO — `forbidNonWhitelisted` không được phá client)

| Event | Payload client gửi | Dòng |
|---|---|---|
| `join_room` | `{ roomCode }` | `:149` |
| `heartbeat` | `{ roomId: roomCode, roomCode, chapterSlug, paragraphId: string \| null, progress, bookId, chapterId }` | `:78-86` |
| `add_highlight` | `{ roomId, chapterSlug, paragraphId, content }` | `:94` |
| `remove_highlight` | `{ roomId, highlightId }` | `:101` |
| `generate_highlight_insight` | `{ roomId, highlightId }` | `:132` |
| `chapter_change` | `{ roomId, chapterSlug, bookId?, chapterId? }` | `:108` |
| `change_mode` | `{ roomId, mode }` | `:139` |
| `end_room` | `{ roomId }` | `:115` |
| `leave_room` | `{ roomId, newHostId? }` / `{ roomId: roomCode, roomCode }` | `:122`, `:236` |

⇒ `heartbeat`, `chapter_change`, `leave_room` **có field thừa** mà client vẫn gửi ⇒ phải khai
báo optional trong DTO (không xoá khỏi type như bản nháp của tài liệu gợi ý ở T1.4).

---

## Sai lệch đã phát hiện ở Phase 0 (và xử lý thế nào)

| # | Giả định cũ | Thực tế | Ảnh hưởng | Xử lý |
|---|---|---|---|---|
| E1 | Q2: "không có `@socket.io/redis-adapter`" | Đã có adapter + đã gắn vào `main.ts` | T7 không cần dependency mới; chỉ gia cố | T7 chỉ thêm `requestsTimeout`, `allowRequest`, try/catch |
| E2 | Q3: giả định chung chung, không đưa ra số TTL cụ thể | TTL user = **30s**, index = **3600s** | Quyết định ngưỡng hết hạn của T6 | T6 đặt `EXPIRE` hash = 90s; `ts` stale = 2.5 × 15s = 37.5s |
| E3 | Q10: "giới hạn `content` 1–1000, `roomCode` theo format domain" — **nhưng bản nháp DTO dùng `OBJECT_ID_PATTERN` cho `roomId`** | `roomId` là `^[A-Z0-9]{6,10}$`; `highlightId` là UUID | **Chặn sai 100% event ghi với client thật** | T1: `ROOM_ID_PATTERN` cho `roomId`, `HIGHLIGHT_ID_PATTERN` (UUID) cho `highlightId` |
| E4 | Q6: không nêu `SocketData` đầy đủ | Thiếu `exp`, `sessionTimer`, `limitTimer` | T4/T5 cần thêm field mới | T5 thêm `exp`/`sessionTimer`; T4 thêm `limitTimer` |
| E5 | Q8: "không kiểm tra rõ ràng" | Đúng — nhưng `countByBook` **không** phải kiểm tra; cần nói rõ để tránh hiểu nhầm rằng đã an toàn | T15 | Giữ xác minh ở gateway, chuyển vào use case ở T15 |
| E6 | Q4: "thứ tự được đảm bảo append" | Append có đúng, nhưng **không nguyên tử qua 3 lần retry OCC** ⇒ `[len-1]` có thể là của người khác | T8 | T8 dùng id do use case sinh |
| E7 | Q12: chỉ trả lời "có reconnect gọi lại join_room" | Bổ sung: `leave_room` khi unmount gửi `roomId = roomCode` | T2/T9 | `requireRoom` so `body.roomId` với `sd.roomId`; `leave_room` xử lý riêng |
| E8 | "namespace `/reading-rooms` đang chạy và chỉ thiếu hardening" | **`SocketModule` không được load ⇒ gateway không hề được nối** (xem P1) | Toàn bộ e2e WS fail; tính năng chết trên mọi môi trường | Hoist `@nestjs/websockets` + `@nestjs/platform-socket.io` lên root (commit riêng, trước T1) |

---

## Phát hiện thêm (không tự sửa trong các task này)

1. **Tách highlight khỏi aggregate `Room`** (`reading-room.entity.ts:41`). Aggregate hiện
   chứa tối đa 500 highlight × 1000 ký tự ≈ 500KB mỗi phòng, mọi lần load phòng đều kéo
   toàn bộ; `add_highlight` chạy OCC nên phải đọc–ghi lại cả mảng. Đây là nguyên nhân gốc của
   F8 và F15. Đề xuất: collection `highlights` riêng, `Room` chỉ giữ `highlightsCount`.
2. **Thông báo lỗi tiếng Việt nằm ở server** (`gateway:527-563`, entity, use case). Client
   hiện chỉ `toast.error(payload.message)`
   (`useReadingRoomSocket.ts:209-212`). Đề xuất: server trả `code` + message mặc định, client
   tự ánh xạ `code` → text; giữ message để tương thích ngược.
3. **Thiếu event thu hồi phiên cho logout** (`LogoutUseCase` không emit gì). Nên thêm
   `EventNames.USER_LOGGED_OUT` và phát từ `LogoutUseCase` để gateway ngắt socket (D2 nêu rõ
   không tự tạo event trong scope task này).
4. **Không có use case đổi mật khẩu** — nếu sau này thêm, cần event tương ứng.
5. **`verifiedChapters` không cache âm** (`gateway:230-247`): chapter sai sách bị tra cứu DB
   mỗi 10s. Sẽ xử lý ở T15.5.
6. **Gateway nằm trong cả worker process** (`gateways.module.ts:50`) dù worker không có
   socket server. `@OnEvent` ở worker có thể gọi `this.server.to(...)` với `server ===
   undefined`. Sẽ guard ở T12/T17.
7. **Không có metric library** trong dự án (`package.json` không có `prom-client`). Sẽ chỉ
   thêm log có cấu trúc ở T17 + ghi đề xuất metric.
8. `chatMessages: []` trong snapshot `join_room` (`gateway:515`) là hằng rỗng — chưa có tính
   năng chat. Ghi nhận tại T14.3.

---

## P1 — BLOCKER phát hiện khi chạy e2e: `@nestjs/websockets` không được load ⇒ **gateway chưa từng chạy**

Phát hiện này **phải sửa trước T1**, vì mọi test e2e của namespace `/reading-rooms` đều fail
với `websocket error` và cả runtime thật cũng không có WebSocket.

**Triệu chứng**

- `GET /socket.io/?EIO=4&transport=polling` → `404` từ Nest (không phải từ Engine.IO).
- `afterInit()` của gateway **không** được gọi; `@WebSocketServer()` giữ `undefined`.
- Client `socket.io-client` luôn `connect_error: websocket error`.

**Nguyên nhân**

`@nestjs/core` nạp `SocketModule` bằng `optionalRequire` **tại thời điểm require module**
(`node_modules/@nestjs/core/nest-application.js:19`):

```js
const { SocketModule } = optionalRequire('@nestjs/websockets/socket-module', () => require('@nestjs/websockets/socket-module'));
```

`optionalRequire` nuốt lỗi và trả `{}` khi resolve thất bại
(`node_modules/@nestjs/core/helpers/optional-require.js:4-11`) ⇒ `SocketModule === undefined`
⇒ `NestApplication.socketModule = undefined` ⇒ `registerWsModule()` (`nest-application.js:87-92`)
bỏ qua hoàn toàn ⇒ **không gateway nào được nối**.

Resolve thất bại vì npm workspace hoist **tách** 2 package: `@nestjs/core` ở
`<root>/node_modules/@nestjs/core` còn `@nestjs/websockets` ở
`backend/node_modules/@nestjs/websockets`. Node/Metro-style resolution từ file của `@nestjs/core`
chỉ dò `node_modules` dọc theo cây thư mục → không nhìn thấy `backend/node_modules`:

```
node -e "console.log(require.resolve('@nestjs/websockets/socket-module',
  { paths: [require('path').dirname(require.resolve('@nestjs/core/nest-application'))] }))"
# trước khi sửa: MODULE_NOT_FOUND
# sau khi sửa:  <root>/node_modules/@nestjs/websockets/socket-module.js
```

**Sửa (không thêm dependency mới)**

Khai báo lại 2 package **đã có sẵn** trong `backend/package.json:70,75` ở `package.json` gốc
(đúng version `^11.1.6`) để npm hoist chúng lên cạnh `@nestjs/core`:

```json
"dependencies": {
  "@nestjs/platform-socket.io": "^11.1.6",
  "@nestjs/websockets": "^11.1.6"
}
```

Sau `npm install`: `<root>/node_modules/@nestjs/{core,common,websockets,platform-socket.io}` cùng
cấp; `backend/node_modules/@nestjs/` chỉ còn package riêng của backend.

⇒ **Không phải dependency mới** — chỉ thay đổi *vị trí cài* để Nest resolve được adapter.
Cần chạy `npm install` ở repo root sau khi pull (đã commit `package.json` + `package-lock.json`).

**Bài học áp dụng cho T1**

- `maxHttpBufferSize` mặc định của socket.io là 1 MB; gateway đang đặt `1e5` (100 KB) trong
  decorator. Payload vượt ngưỡng ⇒ **server đóng connection**, không phải trả `error`.
  Test e2e phải kiểm tra `disconnect`, không được kỳ vọng `VALIDATION_FAILED`.