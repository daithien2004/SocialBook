---
name: prime
description: Nạp lại ngữ cảnh dự án và định vị bước tiếp theo.
disable-model-invocation: true
---
# Prime
Nạp lại ngữ cảnh dự án và định vị bước tiếp theo dựa trên kiến trúc và yêu cầu.

## When to Use
- Sử dụng khi bắt đầu một phiên làm việc mới (phiên chat mới).
- Sử dụng khi cần đánh giá lại trạng thái hiện tại của dự án.
- Khi người dùng gõ `/prime`.

## Instructions
1. Đọc (view_file) nội dung file luật toàn cầu: `.antigravity` kết hợp với `.docs/global_rules.md` (nếu có).
2. Đọc (view_file) tài liệu yêu cầu sản phẩm: `.docs/PRD.md` để hiểu scope.
3. Chạy lệnh terminal `git status` và `git log -1` để xem vị trí commit hiện hành.
4. Tổng hợp thông tin, đưa ra tóm tắt về trạng thái hiện tại của codebase, tài liệu, và hỏi người dùng cần tiếp tục thực thi hay lên kế hoạch cho hạng mục nào trong PRD.
