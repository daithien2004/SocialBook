---
name: plan-feature
description: Rã một tính năng thành kế hoạch thực thi chi tiết.
disable-model-invocation: true
---
# Plan Feature
Rã một tính năng thành kế hoạch thực thi chi tiết trước khi code.

## When to Use
- Khi người dùng có yêu cầu phát triển một tính năng mới.
- Khi cần lên outline các bước thực hiện thay vì nhảy vào code ngay.
- Khi người dùng gõ `/plan-feature` hoặc yêu cầu lập kế hoạch.

## Instructions
1. Đọc và tham chiếu `.docs/PRD.md` để hiểu yêu cầu kinh doanh của tính năng.
2. Nạp Kiến thức Chuyên sâu (Progressive Loading) nếu cần thiết:
   - Nếu tính năng này là cốt lõi, thay đổi nhiều file hoặc ảnh hưởng đến kiến trúc tổng thể, HÃY ĐỌC FILE: `.docs/architecture/craftsman-rules.md` để áp dụng tư duy TDD, BDD, và Clean Architecture trước khi lên kế hoạch.
3. Thực hiện "vibe planning": Đặt câu hỏi cho người dùng để làm rõ giả định nếu ngữ cảnh chưa đủ.
3. Lập bản kế hoạch chi tiết bao gồm: 
   - Architectural Updates (Sự thay đổi về Mô hình DB, Cấu trúc Component).
   - Task List chi tiết tới từng file cần sửa (`[NEW]`, `[MODIFY]`, `[DELETE]`).
   - Validation Strategy (Chiến lược kiểm thử tự động và thủ công).
4. Viết kế hoạch này ra một file mới tại `.docs/tasks/<tên-tính-năng>.md`.
5. Yêu cầu người dùng xem và phê duyệt bản kế hoạch này (thông báo rõ ràng) trước khi thực hiện bước code.
