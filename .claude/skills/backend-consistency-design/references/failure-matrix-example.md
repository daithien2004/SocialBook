# Ví dụ: bảng "chết sau bước nào" cho luồng join phòng đọc

Chuỗi bước:
```
A. Ghi membership vào Mongo (version check, retry khi ConcurrencyException)
B. socket.join(room:<id>)
C. Ghi presence vào Redis (theo socket, TTL)
D. Broadcast MEMBER_JOINED + ACK kèm snapshot
```

| Chết/lỗi sau bước | Trạng thái | Phục hồi | Cần gì |
|---|---|---|---|
| Trước A | Không đổi | Client retry | Không |
| Sau A, trước B | Member có trong DB, socket chưa vào channel, client không nhận ACK | Client gọi lại `join_room` | **Join idempotent**: đã là member thì trả thành công, không báo lỗi |
| Sau B, trước C | Socket đã vào channel, chưa có presence | Retry ghi đè presence theo socket | Ghi presence idempotent; presence có TTL nên tự sạch |
| Sau C, trước D | Dữ liệu đúng, thiếu thông báo | Client reconnect/retry lấy snapshot | Client **luôn** lấy snapshot khi vào; event chỉ là gợi ý |
| Redis lỗi ở C | Member trong DB, không online | Client retry; job đối soát dọn member ma nếu cần | Không rollback Mongo |

Điểm cần xác minh khi áp dụng:
- Khóa theo user khi join là distributed (Redis, có TTL) hay chỉ trong RAM? Trong RAM thì vô tác dụng khi chạy nhiều instance; lúc đó chỉ còn version check.
- Cho socket vào channel **trước** khi dựng snapshot, để không lỡ event giữa hai bước.
- Client có thực sự reconnect rồi `join_room` lại và lấy snapshot không? Toàn bộ khả năng tự hồi phục phía server dựa vào điều này.
