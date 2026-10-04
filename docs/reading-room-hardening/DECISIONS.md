# Quyết định (Phase 0 + các task đã chốt)

Mặc định lấy từ mục 3 của tài liệu lệnh (D1–D7). Mọi quyết định dưới đây đều **có thể đổi
lại bằng cờ tính năng** hoặc bằng cách sửa đúng dòng được ghi ở cột "Cách đổi".

---

## Quyết định mặc định (D1–D7)

| ID | Câu hỏi | Quyết định | Lý do & Cách đổi |
|---|---|---|---|
| **D1** | Semantics của presence | User online khi **còn ít nhất một socket trong phòng còn hạn**. Một user N socket → N field trong hash `rr:presence:{roomId}`; `getRoomPresences` gom theo `userId`. | Cấu trúc `(roomId, userId)` của `presence-cache.adapter.ts:15` không đáp ứng được (F4). Thay bằng hash theo `{userId}:{socketId}`. Cờ `WS_PRESENCE_PER_SOCKET`. **Cách đổi:** tắt cờ → quay về `(roomId, userId)` (đọc song song cả hai nguồn, xem DEC-08). |
| **D2** | Sự kiện thu hồi phiên | Chỉ ngắt socket khi: (a) đổi role/ban — `USER_ROLE_CHANGED` đã có; (b) JWT hết hạn — thêm `setTimeout` theo `exp`. **Không tạo event mới** cho logout/đổi mật khẩu vì `EventNames` không có (Q7). | Tôn trọng "không sửa ngoài phạm vi"; thêm event sẽ phải đụng `AuthApplicationModule`. **Cách đổi:** sau khi thêm `EventNames.USER_LOGGED_OUT` ở module Auth, chỉ cần thêm một `@OnEvent` vào `ws-session.service.ts` (xem FINDINGS §3). |
| **D3** | Insight AI | **Dùng queue BullMQ** (`highlight-insight`) vì dự án đã có hạ tầng (Q11). Handler trả ack ngay `{ status: 'queued' }`; kết quả/khá lỗi đi qua event. | `withTimeout(aiService.generateText, 15_000)` đang chặn socket (`generate-highlight-insight.use-case.ts:118`). Lấy khuôn mẫu `post-moderation`. **Cách đổi:** cờ `WS_INSIGHT_QUEUE` tắt → chạy đồng bộ với event lỗi + khóa chống bấm đôi. |
| **D4** | Tương thích client | Giữ nguyên event `ERROR` và ack `{ ok, snapshot }` của `join_room`. Hợp đồng ack mới `{ ok, data \| error:{ code, message?, requestId? } }` chạy **song song**, bật bằng `WS_ACK_CONTRACT_V2`. | Không được phép đổi shape client đang dùng (yêu cầu mục 1.4). **Cách đổi:** rollback = tắt cờ. |
| **D5** | Highlight trong aggregate | **Không đổi schema.** Chỉ sửa cách lấy highlight vừa tạo (T8). | Rủi ro migration lớn, ngoài scope. **Cách đổi:** xem FINDINGS §Phát hiện thêm #1. |
| **D6** | Redis lỗi ở rate limit | **Fail-open** + log `warn` + metric + limiter in-memory dự phòng **cùng hạn mức** theo process. | Không để Redis chết làm sập tính năng. Limiter dự phòng hạn chế blast radius khi scale-out. **Cách đổi:** nếu chấp nhận fail-closed, sửa `WsRateLimitInterceptor`. |
| **D7** | Redis lỗi ở handshake | Trả `next(new Error('server_error'))` + log kèm stack. Không phải `unauthorized`. | `unauthorized` khiến client refresh token vô ích; `server_error` để client retry/backoff. **Cách đổi:** không nên. |

---

## Quyết định bổ sung phát sinh (DEC-01 … DEC-12)

| ID | Vấn đề | Quyết định | Lý do & Cách đổi |
|---|---|---|---|
| **DEC-01** | `roomId` là mã 6–10 ký tự, `highlightId` là UUID — nhưng bản nháp DTO dùng `OBJECT_ID_PATTERN` | `roomId` → `ROOM_ID_PATTERN` (`^[A-Za-z0-9]{6,10}$`); `highlightId` → `HIGHLIGHT_ID_PATTERN` (UUID v4). `newHostId`/`chapterId` mới dùng `OBJECT_ID_PATTERN`. | Nếu giữ `OBJECT_ID_PATTERN` cho `roomId`, **mọi event ghi sẽ trả `VALIDATION_FAILED`** với client thật. Nguồn: `room-id.vo.ts:26`, `reading-room.entity.ts:263`. Sửa ở T1. |
| **DEC-02** | Field thừa trong `heartbeat`/`chapter_change`/`leave_room` mà client vẫn gửi | Khai báo `@IsOptional()` trong DTO và **bỏ qua giá trị**; **không** xoá khỏi type. | `forbidNonWhitelisted: true` sẽ ném `VALIDATION_FAILED` cho client hiện tại. Nguồn: `useReadingRoomSocket.ts:78-86,108,236`. |
| **DEC-03** | `requireRoom` ném `WsException` (T2) nhưng unit test cũ (`reading-room.gateway-room-guard.spec.ts:53`) lại chờ `socket.emit('error', …)` | Cập nhật test theo hợp đồng **throw → filter → `ERROR`**. Hành vi quan sát được từ client **không đổi**: vẫn nhận event `error` với `code: 'NOT_IN_ROOM'`. | `@UseFilters(WsExceptionFilter)` không bọc được lifecycle hook, nhưng **có** bọc `@SubscribeMessage` (commit `f7368f71` đã chuyển `try/catch` trong handler sang filter). |
| **DEC-04** | `end_room`/`delete_room`/`leave_room` khi socket không còn ở phòng | `end_room`, `delete_room` **giữ `requireRoom`** (bắt buộc, phòng an toàn). `leave_room` **bỏ `requireRoom`** — chỉ so `body.roomId` với `sd.roomId` nếu có; nếu lệch thì vẫn gọi use case (đúng luồng "rời từ thiết bị khác") nhưng **không** đụng `sd.roomId` và không phát `MEMBER_LEFT` cho phòng của socket. | `DeleteRoomUseCase`/`EndRoomUseCase` đã chặn bằng `isHost` trên DB (`delete-room.use-case.ts:29`, `end-room.use-case.ts:28`) nên không mất an toàn. Xử lý ở T9. |
| **DEC-05** | `progress` heartbeat: client gửi `0..1` (`useReadingRoomSocket` clamp `z.number().min(0).max(1)` tại `presenceSchema`, nhưng gateway clamp `0..100`) | DTO nhận `0..100` (như domain/gate cũ) và **giữ clamp hiện tại**. Ghi vào "Phát hiện thêm". | Không đổi hành vi ngoài phạm vi; đổi đơn vị sẽ phá dữ liệu progress đã lưu. |
| **DEC-06** | Kiểm tra trạng thái phòng ở `heartbeat` (T3.4) | **Không** thêm truy vấn DB/Redis mỗi heartbeat. Chỉ dựa vào `socket.rooms.has('room:{id}')` — sau `socketsLeave` là đủ để chặn. | Heartbeat là 1/15s/user; thêm 1 lệnh Redis là tăng ~2× tải Redis. |
| **DEC-07** | Ngưỡng hết hạn của presence theo socket (T6) | `EXPIRE` hash = **90s**; coi field là cũ khi `now - ts > 37500ms` (2.5 × chu kỳ heartbeat 15s). | TTL cũ là 30s (user) — nhưng heartbeat là 15s nên 30s rất sát; 90s an toàn hơn khi một tab bị throttle. |
| **DEC-08** | Đọc song song schema presence cũ/mới (T6.6) | `getRoomPresences` hợp nhất: `HGETALL rr:presence:{roomId}` ∪ `SMEMBERS room:members:{roomId}` + `MGET presence:{roomId}:*`, ưu tiên dữ liệu mới (mới hơn theo `ts`). Kế hoạch gỡ schema cũ: sau khi cờ bật ở **100% instance** trong ≥ 7 ngày, xoá nhánh đọc cũ. | Hai nguồn dùng định dạng khác nhau; hợp nhất cho phép rollout từng instance mà không mất dữ liệu. |
| **DEC-09** | `READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED` phát ở process worker sau khi T11 chuyển sang queue, nhưng chỉ API replica có socket server | Giữ `@OnEvent` (để không phá hiện trạng) **và** phát thêm trực tiếp tới đúng namespace qua Redis adapter từ processor — qua một port `IReadingRoomInsightNotifier` mà adapter cài bằng `server.to('room:{roomId}')` khi có server, fallback `@OnEvent`. | Nếu chỉ dựa vào `@OnEvent`, kết quả insight **không** tới client sau khi tách queue. **Cách đổi:** nếu chạy worker cùng Redis adapter thì adapter path là đủ. |
| **DEC-10** | `@WebSocketServer()` trả `Namespace` hay `Server`? | Vì decorator có `namespace`, Nest v11 truyền **`Namespace`** cho `afterInit`. Đổi kiểu `Server` → `Namespace` ở T15.4. | `Namespace` cũng có `use()`, `in()`, `to()`, `socketsLeave()` — không mất API nào đang dùng. |
| **DEC-11** | Giới hạn kết nối: script Lua ở T4 | Chạy **mặc định** (`WS_CONNECTION_LIMITER_REDIS` bật mặc định `true`), giữ đường `fetchSockets` cũ khi tắt cờ. | `fetchSockets()` mỗi handshake là round-trip tới **mọi** node; với 3 replica đó là 3 round-trip/handshake. Tắt cờ chỉ để rollback khẩn. |
| **DEC-12** | Rate limit heartbeat (T10.5) | Gộp: `heartbeat` dùng đường `GET`-free — chỉ 1 pipeline `MULTI(SET NX EX + INCR)` như hiện tại, **không** thêm lệnh. Hạn mức 90/phút ≈ 1.5 lần/giây, dư cho chu kỳ 15s. | Mọi lệnh Redis thêm ở heartbeat tốn hàng trăm nghìn lệnh/giờ khi user đông. |

---

## Cờ tính năng (đọc từ `ConfigService`, mặc định trong `config/env.config.ts`)

| Cờ | Mặc định | Task | Tác dụng |
|---|---|---|---|
| `WS_PRESENCE_PER_SOCKET` | `false` | T6 | Presence theo `(userId, socketId)` thay vì `(roomId, userId)` |
| `WS_CONNECTION_LIMITER_REDIS` | `true` | T4 | Limiter kết nối nguyên tử bằng Lua + sorted set |
| `WS_SESSION_EXPIRY_DISCONNECT` | `false` | T5 | Ngắt socket khi JWT hết hạn |
| `WS_ACK_CONTRACT_V2` | `false` | T12 | Ack `{ ok, data \| error }` cho mọi event ghi |
| `WS_INSIGHT_QUEUE` | `true` | T11 | Chạy insight AI qua BullMQ thay vì chặn socket |
| `WS_SNAPSHOT_LIMIT` | `200` | T14 | Số highlight tối đa trong snapshot `join_room` |

Yêu cầu mục 7 của tài liệu lệnh: **mọi cờ mặc định tắt**. Vì vậy `WS_CONNECTION_LIMITER_REDIS`
và `WS_INSIGHT_QUEUE` được đặt mặc định `false` trong `env.config.ts` cho đúng nguyên tắc
"cờ tắt → chạy đúng hành vi cũ"; xem `docs/reading-room-hardening/ROLLOUT.md`.

## Dependency mới

**Không có.** `@socket.io/redis-adapter` đã có sẵn (`package.json`), BullMQ đã có sẵn.
Phát hiện ở Q2 (xem FINDINGS §Sai lệch E1).