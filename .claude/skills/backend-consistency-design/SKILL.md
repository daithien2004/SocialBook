---
name: backend-consistency-design
description: Quy trình thiết kế đúng cho MỌI logic backend mới hoặc sửa logic ghi dữ liệu (NestJS + MongoDB + Redis + BullMQ + Socket.IO). Dùng skill này bất cứ khi nào viết hoặc review command/handler/use case, API tạo/sửa/xóa, join/leave, đếm giới hạn, thanh toán, thông báo, side effect ngoài DB, retry, timeout, rớt mạng, race condition, transaction, idempotency, eventual consistency, outbox, hoặc khi user hỏi "có cần transaction không", "chết giữa chừng thì sao", "hai request cùng lúc". Dùng cả khi user không nhắc từ khóa nào ở trên mà chỉ nói "viết logic X".
---

# Thiết kế logic ghi dữ liệu cho production

Mục tiêu: mỗi use case mới có hành vi **đúng khi đồng thời, khi lỗi một phần, khi retry, khi mạng đứt**, mà không thêm cơ chế thừa. Lý do tồn tại của skill: lỗi production gần như luôn đến từ lock, retry, idempotency và state lệch giữa các hệ thống, hiếm khi từ cấu trúc thư mục.

## Quy trình (đi lần lượt, viết kết quả ra trước khi code)

1. **Phân loại dữ liệu** (bảng dưới). Quyết định mức đảm bảo cần có.
2. **Viết quy tắc bắt buộc đúng** thành một câu cụ thể, và chỉ rõ **nguồn sự thật** (mỗi dữ liệu đúng một nguồn; phần còn lại là bản sao dẫn xuất dựng lại được).
3. **Vẽ chuỗi bước**, đánh dấu ranh giới: Mongo / Redis / queue / socket / dịch vụ ngoài.
4. **Với mỗi bước, hỏi 3 câu:**
   - Hai request đồng thời thì sao?
   - Process chết ngay sau bước này thì trạng thái có chấp nhận được không?
   - Retry bước này thì có hỏng gì không?
5. **Chọn cơ chế nhẹ nhất đủ dùng** (thang dưới). Chỗ nào chấp nhận được thì không thêm gì.
6. **Áp quy tắc thứ tự:** ghi nguồn sự thật trước → side effect sau commit → side effect lỗi thì log + có đường hồi phục, không rollback dây chuyền.
7. **Viết test** cho từng điểm "chết" đã liệt kê (gọi handler hai lần, giả lập Redis/queue lỗi, hai request song song).
8. **Thêm quan sát:** log có traceId, metric cho conflict/retry/job fail.

Trước khi viết code, đưa cho user một **design note ngắn** theo mẫu ở cuối file. Với việc nhỏ (CRUD đơn giản, không có luật đồng thời) chỉ cần 3-4 dòng, đừng làm nặng.

## Bước 1: Bốn loại dữ liệu

| Loại | Ví dụ | Mất thì sao | Mức đảm bảo | Nơi lưu |
|---|---|---|---|---|
| **A. Quan trọng** | tài khoản, membership, đơn hàng, quyền | Không chấp nhận | atomic, bền, idempotent | Mongo |
| **B. Dẫn xuất** | reading list, thống kê, recommendation | Tính lại được | eventual | Mongo/Redis |
| **C. Tạm thời** | presence, ticket WS, rate limit | Tự hết hạn | best effort + TTL | Redis |
| **D. Thông báo** | broadcast, socket event, push | Client tự đồng bộ lại | không đảm bảo | Socket.IO/queue |

Loại A cần toàn bộ quy trình. Loại C, D thường không cần cơ chế nào, đừng cố làm strong consistency cho presence lệch vài giây.

## Bước 5: Thang cơ chế (đi từ trên xuống, dừng khi đủ)

1. **Unique index** để chặn trùng. Rẻ và chắc nhất.
2. **Update có điều kiện** trong một thao tác (`findOneAndUpdate` với điều kiện nghiệp vụ nằm trong filter).
3. **Version/optimistic lock + retry có giới hạn** cho một document, xung đột hiếm. Retry phải **đọc lại** trạng thái và kiểm tra lại luật.
4. **Transaction (`UnitOfWorkPort`)** khi nhiều document Mongo phải cùng thành công hoặc cùng thất bại.
5. **Queue + handler idempotent** cho việc chậm hoặc làm bất đồng bộ được.
6. **Outbox** khi side effect ngoài Mongo là **bắt buộc** gửi cùng thay đổi dữ liệu (thanh toán, thông báo bắt buộc, đồng bộ hệ thống khác).

Chi tiết và code mẫu từng cơ chế: `references/mechanisms.md`. Đọc khi cần triển khai.

## Những điều hay sai (đọc kỹ)

- **Check-then-insert bị race.** "Đếm số phòng của host rồi insert" cho phép hai request cùng thấy còn chỗ. Transaction Mongo mặc định **không** chặn việc này. Đưa ràng buộc vào chính thao tác ghi (unique index, update có điều kiện trên counter), hoặc chấp nhận vượt nhẹ nếu luật chỉ là chống lạm dụng và đã có throttle. Ghi rõ lựa chọn trong design note.
- **Transaction Mongo không bao Redis, BullMQ, Socket.IO, email.** Đừng kỳ vọng rollback chúng.
- **Side effect trước commit.** Commit lỗi thì side effect đã đi (email cho thứ không tồn tại). Luôn gọi sau commit.
- **Retry mà handler không idempotent** biến lỗi tạm thành dữ liệu trùng. Mọi handler chạy từ queue hoặc client có thể gọi lại phải idempotent.
- **Timeout không có nghĩa thất bại.** Server có thể đã commit nhưng response không tới. Thao tác tạo tài nguyên cần idempotency key hoặc cách đọc lại trạng thái.
- **Rollback dây chuyền** (Redis lỗi thì rollback Mongo) thường phức tạp hơn và chính rollback cũng lỗi được. Ưu tiên: thao tác join lại thành công (idempotent) + job đối soát dọn trạng thái ma.
- **Nuốt lỗi không log.** Eventual consistency chỉ an toàn khi nhìn thấy độ lệch.
- **Nhận field vào DTO rồi bỏ qua im lặng.** Hoặc dùng, hoặc validate và trả lỗi, hoặc bỏ khỏi DTO/Swagger.

## Mạng đứt: bốn vị trí khác nhau

1. Client đứt trước khi gửi: server không biết gì, client retry. Không vấn đề.
2. Client gửi, server xử lý, response không tới: **nguy hiểm nhất**. Cần thao tác idempotent / idempotency key.
3. Server chết giữa chừng: dùng bảng "chết sau bước nào" (dưới).
4. Client đứt khi đang nhận event: event mất vĩnh viễn. Cần đường **reconcile**: reconnect thì lấy snapshot; event mang `version` để phát hiện thiếu.

Nguyên tắc nền: **event realtime chỉ là gợi ý, snapshot mới là sự thật.**

## Mẫu design note (đưa cho user trước khi code)

```
Use case: <tên>
Dữ liệu: <loại A/B/C/D>, nguồn sự thật: <collection/key>
Quy tắc bắt buộc đúng: <một câu>
Đồng thời: <race nào có thể xảy ra> → cơ chế: <unique/conditional/version/tx/none>
Chuỗi bước:
  1. <bước> [Mongo]
  2. <bước> [Redis]   (sau commit)
  3. <bước> [socket]  (sau commit)
Chết sau bước | Trạng thái | Phục hồi | Chấp nhận?
  1 | ... | ... | ...
Retry/timeout: <idempotent bằng cách nào>
Side effect lỗi: <log + đường hồi phục>
Test: <danh sách>
Quan sát: <log/metric>
```

Ví dụ điền sẵn cho luồng join phòng: `references/failure-matrix-example.md`.

## Khi nào KHÔNG cần đi đủ quy trình

CRUD đơn giản không có luật đếm/đồng thời, không side effect ngoài Mongo (genres, authors...): chỉ cần validate ở biên, unique index nếu có ràng buộc trùng, và đảm bảo không nhận field rồi bỏ qua. Đừng thêm transaction, outbox, queue chỉ để "cho chắc".
