# Reading-rooms: các điểm cần xác minh trong code (chưa khẳng định)

Rút ra từ phần mô tả flow tạo phòng → join → heartbeat. Mỗi mục cần đọc code để xác nhận rồi mới phân loại thành finding.

| # | Điểm cần xác minh | Vì sao quan trọng | Ưu tiên dự kiến |
|---|---|---|---|
| 1 | Khóa theo user khi `join_room` nằm ở đâu: Map/mutex RAM hay Redis lock có TTL? | RAM không chặn đồng thời giữa các instance; khi đó chỉ còn version check | P1 nếu RAM và không có retry đủ |
| 2 | Debounce job tiến độ của BullMQ thay payload hay giữ job cũ? | Có thể lưu giá trị cũ nhất trong cửa sổ 10 giây | P1/P2 |
| 3 | Check-then-insert "tối đa số phòng hoạt động của host" trong `CreateRoomHandler` | Hai request đồng thời có thể vượt giới hạn | P2 (P1 nếu luật nghiêm ngặt) |
| 4 | `currentChapterSlug` trong DTO bị bỏ qua, handler luôn dùng chương đầu | Lỗi hợp đồng API, client bị lờ im lặng | P2, sửa nhanh |
| 5 | Presence khi instance chết: SIGTERM có dọn presence của instance? TTL 90s so với ping 25s + timeout 20s | User hiện online tối đa 90s sau khi process chết | P2/P3 |
| 6 | `WsThrottleGuard` đếm theo user, lưu Redis, khớp tần suất heartbeat | Nhiều tab lách throttle, hoặc chặn nhầm heartbeat | P2 |
| 7 | Socket vào channel `room:<id>` trước hay sau khi dựng snapshot | Có thể lỡ một event giữa hai bước | P3 |
| 8 | `traceId` có đi vào socket context và payload job không | Không truy vết được hành trình HTTP → WS → worker | P3 |
| 9 | Worker dùng `createApplicationContext` + `enableShutdownHooks`? Có health cho worker? | SIGTERM làm job stalled; worker khởi tạo thừa gateway | P2 |
| 10 | Test xác nhận processor không có trong container ở API mode; mặc định không-worker khi thiếu `WORKER_MODE` | Thứ tự import là điểm giòn; seed/test có thể vô tình consume queue | P2 |
| 11 | Job đối soát cho member ma và phòng bỏ hoang | Lưới an toàn cho khoảng hở Mongo/Redis | P2 |
| 12 | Failed job BullMQ giữ 7 ngày có alert không | Không alert thì không ai thấy | P2 |
| 13 | Enqueue lỗi có làm hỏng presence/ACK của heartbeat không | Hai việc nên tách lỗi | P3 |
| 14 | Client có reconnect rồi `join_room` lại và lấy snapshot mới không | Toàn bộ tự hồi phục phía server dựa vào hành vi này | P1 nếu thiếu |

Đã có sẵn và đáng giữ: ticket WS dùng `GETDEL`, Redis adapter với pub/sub client riêng, processor chỉ đăng ký ở worker mode, version check ở repository kèm retry khi join, join idempotent ở phần membership, ghi tiến độ monotonic, presence có TTL + grace khi disconnect, lỗi HTTP/WS được chuẩn hóa.
