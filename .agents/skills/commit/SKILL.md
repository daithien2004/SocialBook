---
name: commit
description: Phân tích thay đổi và tạo commit message chuẩn.
disable-model-invocation: true
---
# Commit
Phân tích những thay đổi trong working directory và lưu vào lịch sử Git.

## When to Use
- Sau khi hoàn thành một task và code đã được validate.
- Khi người dùng muốn lưu lại trạng thái (save state) mã nguồn.
- Khi người dùng gõ `/commit`.

## Instructions
1. Chạy lệnh `git status` để xem các file bị thay đổi.
2. Chạy lệnh `git diff` để hiểu nội dung thay đổi (chú ý giới hạn đầu ra nếu cần thiết).
3. Đối chiếu thay đổi với file task `.docs/tasks/<task-name>.md` (nếu có) hoặc `.docs/PRD.md`.
4. Soạn thảo commit message theo chuẩn `Conventional Commits` (VD: `feat:`, `fix:`, `refactor:`).
5. Phần body của commit message RẤT QUAN TRỌNG: giải thích rõ "Tại sao" lại thực hiện quyết định, logic này để xây dựng bộ nhớ dài hạn tốt cho dự án.
6. In ra commit message đề nghị cho người dùng review. Ngay sau đó chủ động gọi lệnh tạo commit (`git add .` và `git commit -m "..."`) dưới cơ chế chờ xác nhận (wait for approval).
