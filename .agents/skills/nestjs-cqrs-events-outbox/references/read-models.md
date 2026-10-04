# Read model và projector

Chỉ dùng khi bước rẻ hơn không đủ. Thứ tự thử:

1. Index, sửa query, bỏ N+1.
2. Read replica cho query nặng.
3. Cache (Redis) cho dữ liệu đọc nhiều, ít đổi.
4. **Bảng đọc riêng trong cùng database, cập nhật trong cùng transaction** với ghi (vẫn nhất quán ngay).
5. Materialized view.
6. Projector + queue + store riêng (đánh đổi: eventual consistency).

## Projector đúng

```ts
// idempotent + chống đảo thứ tự bằng version của aggregate
async on(e: RoomRenamedEvent) {
  await this.db.query(
    `UPDATE room_list SET name = $1, version = $2
      WHERE room_id = $3 AND version < $2`,       // event cũ hoặc trùng thì không làm gì
    [e.name, e.version, e.aggregateId],
  );
}
```

Với event tạo mới: `INSERT ... ON CONFLICT (room_id) DO UPDATE ... WHERE excluded.version > room_list.version`.

Event cần mang `version` của aggregate sau thay đổi.

## Bắt buộc phải có

- **Idempotent:** áp dụng cùng event hai lần cho cùng kết quả.
- **Chịu đảo thứ tự** (qua version) hoặc đảm bảo thứ tự theo aggregate ở relay.
- **Rebuild được:** có lệnh dựng lại read model từ nguồn sự thật (bảng aggregate hoặc outbox lưu lâu). Không có rebuild thì lỗi projector là sai vĩnh viễn.
- **Đo độ trễ:** chênh lệch giữa thời điểm ghi và thời điểm projector đuổi kịp, có cảnh báo.
- **Xử lý lỗi rõ ràng:** event lỗi không chặn cả hàng đợi. Retry có giới hạn rồi dead-letter.

## Eventual consistency ở phía người dùng

Người dùng vừa ghi rồi đọc ngay có thể chưa thấy dữ liệu mới. Cách xử lý:

- Command trả DTO vừa tạo, client hiển thị ngay (optimistic UI).
- Đọc thẳng từ nguồn ghi trong vài giây đầu cho chính người vừa ghi.
- Hoặc query chờ projector đuổi kịp version đã biết (có timeout).

## Dữ liệu tạm đọc nhiều (ví dụ presence)

Presence trong Redis đã là một read model theo kiểu khác: dựng từ heartbeat, có TTL, không dựa vào event bền vững. Phù hợp vì dữ liệu tự lành sau vài giây. Nhớ: TTL cho entry, chống ghi trùng, broadcast có debounce.
