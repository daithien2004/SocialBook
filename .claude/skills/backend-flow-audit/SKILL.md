---
name: backend-flow-audit
description: Quy trình audit một luồng (flow) backend theo hành trình từ entry point đến database/cache/queue để tìm lỗi nhất quán, đồng thời, lỗi một phần, retry, scale nhiều instance. Dùng skill này khi user nhờ audit, review backend, "kiểm tra flow X", "tìm lỗ hổng production", "đánh giá có scale được không", "chỗ nào có thể sai khi chạy nhiều instance", hoặc muốn một báo cáo findings có mức ưu tiên cho một feature như reading-rooms, auth, library, notifications.
---

# Audit một luồng backend

Audit theo **flow quan trọng**, không audit toàn repo. Một flow là một hành trình người dùng đi qua nhiều ranh giới (HTTP, WebSocket, worker). Chọn các flow có dữ liệu loại A (quan trọng) hoặc có đồng thời/realtime/queue; bỏ qua CRUD đơn giản.

Dựa trên hai skill: `backend-consistency-design` (khung phân tích) và `realtime-queue-reliability` (quy tắc realtime/queue). Đọc chúng khi cần chi tiết.

## Quy trình

1. **Xác định flow và ranh giới.** Liệt kê các điểm vào (route, WS event, job) và đọc code theo chuỗi: entry → xác thực/validate → controller/gateway → command/query bus → handler → domain rule/port → adapter → Mongo/Redis/queue → response/event.
2. **Phân loại dữ liệu** của từng thứ được ghi (A/B/C/D) và xác định nguồn sự thật.
3. **Lập bảng bước** của flow, đánh dấu ranh giới từng bước.
4. **Với mỗi bước chạy ba câu hỏi:** đồng thời thì sao? chết sau bước này thì sao? retry thì sao? Ghi vào bảng "chết sau bước nào".
5. **Kiểm tra theo checklist** dưới đây, **đọc code thật** để xác nhận từng điểm, đừng suy đoán từ tài liệu.
6. **Viết findings** theo mẫu, xếp theo mức ưu tiên.
7. **Đề xuất test** tái hiện từng finding quan trọng.

## Checklist theo nhóm

**Đồng thời và nhất quán**
- [ ] Có check-then-write trên nhiều document (đếm giới hạn, "chưa tồn tại thì tạo") mà không có unique index/update có điều kiện?
- [ ] Version conflict được retry có giới hạn, đọc lại và kiểm tra lại luật? Hết retry trả lỗi rõ?
- [ ] Lock trong RAM hay distributed? Có bị lách khi chạy nhiều instance?
- [ ] Nhiều lần ghi cần cùng đúng đã nằm trong `UnitOfWorkPort` chưa? Có gọi Redis/queue/socket bên trong transaction không?

**Lỗi một phần và retry**
- [ ] Side effect (cache, event, enqueue, email) gọi **sau** commit?
- [ ] Handler từ queue và thao tác client có thể retry có idempotent?
- [ ] Timeout phía client sau khi server đã commit: retry có tạo bản ghi trùng? Có idempotency key hoặc cách đọc lại trạng thái?
- [ ] Lỗi một thành phần phụ (enqueue, presence) có kéo hỏng cả request không cần thiết?

**Realtime và scale**
- [ ] State presence/progress ở Redis có TTL, không ở RAM process?
- [ ] Redis adapter, pub/sub client riêng, xử lý Redis đứt/nối lại?
- [ ] Throttle theo user, ở Redis, khớp tần suất client?
- [ ] Client reconnect có `join_room`/lấy snapshot lại? Event có `version` để phát hiện thiếu?
- [ ] Socket vào channel trước khi dựng snapshot?
- [ ] SIGTERM/graceful shutdown dọn state của instance và đóng worker đúng?

**Queue**
- [ ] Debounce/dedupe thay payload hay giữ job cũ? (xác minh bằng test)
- [ ] Ghi tiến độ monotonic? Lỗi vĩnh viễn không retry vô ích?
- [ ] Failed job có alert? API process không consume job (có test)?
- [ ] `traceId` truyền xuyên HTTP → socket → job?

**Hợp đồng và bảo vệ**
- [ ] Field nhận vào DTO đều được dùng hoặc validate? (không nhận rồi bỏ qua)
- [ ] Quyền kiểm tra ở handler, validate ở biên, luật ở domain?
- [ ] Lỗi chuẩn hóa (Problem Details / ACK lỗi) và có traceId?

**Quan sát và đối soát**
- [ ] Metric cho conflict/retry/queue/failed/Redis reconnect?
- [ ] Có job đối soát cho mọi cơ chế eventual consistency (member ma, phòng bỏ hoang, counter lệch)?

## Mẫu finding

```
### [P1|P2|P3] <tiêu đề ngắn>
- Vị trí: <file:dòng>
- Hiện trạng: <code đang làm gì, bằng chứng từ code>
- Rủi ro: <kịch bản cụ thể khi nào hỏng, hậu quả>
- Loại dữ liệu bị ảnh hưởng: A/B/C/D
- Đề xuất: <cơ chế nhẹ nhất đủ sửa>
- Test tái hiện: <mô tả>
```
Mức ưu tiên: **P1** sai dữ liệu loại A hoặc hỏng khi chạy nhiều instance; **P2** lệch tạm thời không tự hồi phục hoặc thiếu quan sát; **P3** dọn dẹp/gọn code. Chỉ báo finding khi đã xác nhận trong code; điều chưa xác nhận được ghi vào mục "Cần xác minh" thay vì khẳng định.

## Thứ tự xử lý đề xuất

Correctness và scale (lock, debounce/queue, presence TTL, state ra Redis, shutdown) trước; sau đó hợp đồng API; sau cùng dọn cấu trúc/mapping. Cấu trúc thư mục hiếm khi là nguyên nhân lỗi production.

## Đầu ra

Một báo cáo gồm: tóm tắt flow, bảng "chết sau bước nào", danh sách findings theo ưu tiên, mục "Cần xác minh", đề xuất test. Với tham chiếu những điểm đã nêu ở flow reading-rooms cần xác minh, xem `references/reading-rooms-open-items.md`.
