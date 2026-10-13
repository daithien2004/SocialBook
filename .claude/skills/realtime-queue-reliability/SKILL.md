---
name: realtime-queue-reliability
description: Quy tắc độ tin cậy và scale cho Socket.IO, presence, Redis, BullMQ queue/worker trong backend NestJS. Dùng skill này khi viết hoặc sửa WebSocket gateway, event realtime, join/leave/reconnect, presence/heartbeat, broadcast, WS auth ticket, WS throttle, Socket.IO Redis adapter, BullMQ queue/processor/job, debounce/dedupe job, retry/backoff, failed job, graceful shutdown, chạy nhiều instance, hoặc khi user hỏi "scale nhiều instance", "mất event", "presence sai", "job bị lặp/mất", "rớt mạng thì sao" trong phần realtime hoặc queue.
---

# Realtime và queue: độ tin cậy khi chạy nhiều instance

Hai nguyên tắc nền chi phối mọi thứ dưới đây:
1. **Event realtime chỉ là gợi ý, snapshot mới là sự thật.** Client vẫn đúng sau khi mất một event thì thiết kế an toàn.
2. **Không giữ state cần chính xác trong RAM của process.** Process có thể chết hoặc có N bản. State bền ở Mongo, state tạm ở Redis có TTL; thứ chấp nhận mất mới được ở RAM.

Quy trình thiết kế cho phần ghi dữ liệu: dùng skill `backend-consistency-design`. File này chỉ chứa quy tắc riêng cho realtime và queue.

## Socket.IO và gateway

**Kết nối và auth**
- Handshake dùng ticket một lần (Redis `GETDEL`), gắn user vào `socket.data`. Ticket có TTL ngắn.
- Mọi event có payload đều qua `WsValidationPipe` + DTO. Event phụ thuộc phòng qua `WsRoomGuard` xác nhận socket thuộc đúng room.
- Throttle theo **user** (không theo socket, vì nhiều tab lách được), lưu ở **Redis** (không RAM). Ngưỡng throttle phải khớp tần suất heartbeat của client, tránh chặn heartbeat hợp lệ.

**Scale nhiều instance**
- Dùng Socket.IO Redis adapter với publisher/subscriber client **riêng**. Xử lý sự kiện Redis đứt/nối lại (log, không crash, kiểm tra lại room membership sau reconnect).
- Không lưu danh sách socket/phòng trong Map RAM để ra quyết định. Dùng Redis hoặc `fetchSockets()` của adapter.
- Khóa/serialize thao tác theo user phải là **distributed** (Redis lock có TTL) nếu cần chặn đồng thời giữa các instance. Lock trong RAM chỉ chống được trong một process; nếu dùng, ghi rõ và vẫn dựa vào version check ở repository.

**Join/leave/reconnect**
- Join phải **idempotent**: đã là member thì trả thành công kèm snapshot, không báo lỗi.
- Cho socket vào channel **trước** khi dựng snapshot trả về trong ACK, để không lỡ event giữa hai bước.
- Event thay đổi liên tục nên mang `version`/`seq` của phòng; client thấy nhảy cách quãng thì tự lấy lại snapshot.
- Thứ tự ghi: Mongo (nguồn sự thật) → `socket.join` → presence Redis → broadcast + ACK. Lỗi ở các bước sau Mongo không rollback Mongo; dựa vào join lại idempotent và job đối soát.

**Presence**
- Lưu theo socket trong Redis với **TTL**; heartbeat làm mới TTL. Không chỉ dựa vào event `disconnect` (process bị kill sẽ làm user online mãi).
- Khi `disconnect`: chờ grace ngắn (chống chớp online/offline khi reconnect), chỉ xóa presence nếu user không còn socket nào khác trong phòng.
- SIGTERM: dọn presence của socket thuộc instance đó (hoặc chấp nhận chờ TTL, nhưng ghi rõ). TTL càng ngắn thì lệch càng ngắn nhưng heartbeat phải tương ứng.
- Timer gom broadcast trong RAM mất khi process chết là chấp nhận được **chỉ khi** client có đường làm mới (snapshot khi reconnect hoặc lấy lại định kỳ).

**Tách lỗi**
- Lỗi enqueue tiến độ không được làm hỏng presence/ACK heartbeat. Hai việc độc lập: bắt lỗi riêng, log, trả ACK phù hợp.
- ACK realtime không đồng nghĩa dữ liệu đã lưu khi việc ghi chạy bất đồng bộ. UI không hiển thị "đã lưu" dựa trên ACK đó.

## BullMQ: queue, processor, worker

**Đăng ký**
- Kết nối ở `core/queue`; `registerQueue` ở feature dùng nó; processor chỉ đăng ký khi `isWorkerProcess()`. Scale API không được kéo theo consume queue.
- Mặc định job options dùng chung (`shared/queue/default-job-options.ts`): `attempts` có giới hạn, `backoff` exponential, `removeOnComplete` giới hạn, giữ failed có thời hạn. Đừng ghi đè rải rác từng nơi nếu không có lý do.

**Handler chạy từ queue**
- **Phải idempotent**: BullMQ có thể chạy lại (retry, stalled job). Side effect trùng (xóa cache, gửi thông báo) phải an toàn khi lặp.
- Ghi tiến độ/giá trị tích lũy theo kiểu **monotonic** (`max`, hoặc kèm timestamp), không ghi đè mù, để job đến trễ hay đa thiết bị không làm lùi dữ liệu.
- Chỉ retry lỗi tạm thời. Lỗi nghiệp vụ vĩnh viễn (sách không tồn tại) nên `UnrecoverableError`/không retry, tránh đốt 3 lần vô ích.
- `payload` là schema versioned ở `shared/queue`; consumer chịu được payload cũ khi deploy dần.

**Debounce/dedupe**
- Kiểm tra bằng **test** hành vi thực tế của cơ chế đang dùng: job mới có **thay payload** đang chờ, hay bị **bỏ** và giữ job cũ? Hai kiểu này cho kết quả lưu khác nhau trong cửa sổ debounce. Đừng suy ra từ tài liệu.
- Key debounce phải đủ hẹp (userId + bookId + chapterId) nhưng không vô hạn (tránh phình số key).

**Vận hành**
- Có **alert** khi số job failed tăng hoặc queue dài bất thường; failed giữ 7 ngày mà không ai nhìn là vô nghĩa.
- Graceful shutdown: `enableShutdownHooks()` để worker đóng đúng, chờ job đang chạy, tránh stalled.
- Worker không có HTTP: cần liveness/readiness riêng (cổng health nhỏ hoặc kiểm tra kết nối Redis/Mongo).
- Truyền `traceId` vào payload job để truy vết HTTP → WS → worker bằng một id.

## Quan sát tối thiểu

Metric: số `ConcurrencyException` và retry join, độ dài queue, số job failed/stalled, số lần Redis reconnect, số socket kết nối, tỉ lệ ACK lỗi. Log có `traceId`. Thiếu các tín hiệu này thì eventual consistency không an toàn vì không thấy độ lệch.

## Test lỗi một phần (bắt buộc cho luồng quan trọng)

- Redis chết giữa join, rồi client join lại: kết quả đúng, không member trùng.
- Worker chết giữa job: job chạy lại và kết quả không đổi (idempotent).
- Hai heartbeat đến sai thứ tự: tiến độ không lùi.
- Hai join đồng thời vào phòng gần đầy: đúng một người vào, người kia nhận lỗi "phòng đầy" sau retry.
- API process không consume job; worker process có consume.
