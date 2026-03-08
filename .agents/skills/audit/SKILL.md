---
name: audit
description: Kiểm toán toàn bộ hoặc một phần codebase xem có tuân thủ đúng kiến trúc Clean Architecture, SOLID và quy tắc của dự án hay không.
disable-model-invocation: true
---
# Audit
Thực hiện rà soát mã nguồn hiện hành (Backend/Frontend) đối chiếu với bộ luật tiêu chuẩn của dự án.

## When to Use
- Khi người dùng muốn biết code cũ viết đã chuẩn chưa.
- Khi người dùng gõ `/audit <đường-dẫn-thư-mục>`.
- Trước khi refactor codebase.

## Instructions
1. Đọc (view_file) nội dung file luật toàn cầu `.antigravity` và `.docs/architecture/craftsman-rules.md` để lấy hệ quy chiếu.
2. Quét thư mục mục tiêu mà người dùng yêu cầu (ví dụ: `backend/src/domain/users`). Nếu người dùng không chỉ định, hãy hỏi họ muốn audit Frontend hay Backend, thư mục nào.
3. Đọc mã nguồn các file quan trọng trong thư mục đó (Controllers, Services, Entities).
4. Đánh giá mã nguồn dựa trên các tiêu chí:
   - **Clean Architecture & Hexagonal:** Code có bị lọt logic framework (HTTP, Express) vào trong Entity/Domain không? Repository pattern có được áp dụng đúng không?
   - **SOLID Principles:** Các class/function có quá to (vi phạm Single Responsibility) không?
   - **Naming Conventions & RO-RO:** Biến boolean có bắt đầu bằng `is/has/can` không? Hàm có bắt đầu bằng Động từ không? Hàm có bị truyền quá nhiều tham số thay vì dùng Object (RO-RO) không?
   - **TDD/Testing:** Thư mục đó đã có file `.spec.ts` đi kèm chưa?
5. Lập báo cáo chi tiết:
   - 🟢 Những điểm đã làm tốt.
   - 🔴 Những Code Smell (vi phạm rule).
   - 🛠 Đề xuất Refactor cụ thể (kèm đoạn code minh họa sửa đổi).
6. Hỏi người dùng có muốn AI tự động tiến hành Refactor dựa trên đề xuất không.
