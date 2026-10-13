# Cơ chế đồng thời và nhất quán: cách triển khai (Mongoose/NestJS)

Mục lục: 1 Unique index · 2 Update có điều kiện · 3 Version + retry · 4 Transaction · 5 Idempotency key · 6 Outbox · 7 Job đối soát

## 1. Unique index
Dùng cho mọi luật "không trùng". Bắt lỗi trùng key (code 11000) ở repository và chuyển thành domain exception có nghĩa (hoặc coi là thành công nếu thao tác idempotent).
```ts
schema.index({ roomId: 1, userId: 1 }, { unique: true });
```
Unique index **một phần** (`partialFilterExpression`) khi luật chỉ áp dụng cho bản ghi đang hoạt động.

## 2. Update có điều kiện (chống vượt giới hạn)
Đưa điều kiện nghiệp vụ vào filter để kiểm tra và ghi là một thao tác nguyên tử.
```ts
const res = await Model.findOneAndUpdate(
  { _id: roomId, membersCount: { $lt: maxMembers } },
  { $inc: { membersCount: 1 }, $push: { members: member } },
  { new: true },
);
if (!res) throw new RoomFullOrMissingException();
```
Với luật đếm trên nhiều document ("host tối đa N phòng"): giữ một counter nguyên tử trên document của host (hoặc collection quota), tăng bằng update có điều kiện `{ activeRooms: { $lt: N } }` trước khi tạo phòng, và giảm khi đóng phòng. Nhớ có job đối soát vì counter có thể lệch khi lỗi giữa chừng.

## 3. Version (optimistic lock) + retry
Dùng khi cập nhật một document có logic domain phức tạp, khó biểu diễn bằng một update.
- Update với `{ _id, version }`, `$inc: { version: 1 }`. Không khớp thì ném `ConcurrencyException`.
- Handler retry **số lần giới hạn** (ví dụ 3-5) có jitter ngắn. Mỗi lần retry phải **đọc lại** document và chạy lại luật domain (kiểm tra "phòng đầy" trên trạng thái mới).
- Hết retry thì trả lỗi rõ cho client (409/ack lỗi), không treo.
- Đếm số `ConcurrencyException` và số lần retry thành metric. Tăng đột biến nghĩa là điểm nóng.

## 4. Transaction
```ts
await this.uow.run(async () => {
  await this.readingListRepo.save(list);
  await this.progressRepo.save(progress);
});
```
- Chỉ dùng khi nhiều document phải cùng đúng. Một document thì update nguyên tử/version là đủ.
- Không đặt gọi Redis, queue, socket, HTTP ngoài **bên trong** transaction: chúng không rollback được và giữ transaction lâu.
- Side effect (xóa cache, emit event, enqueue) đặt **sau** khi `run` trả về.
- Transaction cần replica set. Giữ transaction ngắn.

## 5. Idempotency key (client có thể retry thao tác tạo)
- Client gửi header `Idempotency-Key` (UUID) cho thao tác tạo tài nguyên/thanh toán.
- Collection `idempotency_keys`: unique index `{ userId, key }`, TTL index (24-48 giờ), lưu trạng thái (`in_progress | done`) và response/resourceId.
- Luồng: chèn key (`in_progress`) → nếu trùng key: trả kết quả đã lưu (hoặc 409 nếu đang `in_progress`) → thực hiện → cập nhật `done` + resourceId.
- Thao tác tự nhiên idempotent (join phòng: đã là member thì trả thành công) thì không cần key.

## 6. Outbox (chỉ khi side effect bắt buộc gửi)
- Trong **cùng transaction** với thay đổi dữ liệu, ghi một dòng vào collection `outbox` `{ id, type, payload, status: 'pending', createdAt }`.
- Một worker định kỳ lấy dòng `pending`, đẩy ra queue/dịch vụ ngoài, rồi đánh dấu `sent`. Cho phép gửi **ít nhất một lần**, nên consumer phải idempotent (dedupe theo `id` của outbox).
- Giữ dòng đã gửi một thời gian rồi dọn bằng TTL.
- Không dùng outbox cho broadcast cosmetic hay presence: client tự reconcile.

## 7. Job đối soát (lưới an toàn)
Mọi cơ chế eventual consistency cần job định kỳ sửa độ lệch: dọn member không hoạt động, đóng phòng không còn ai, tính lại counter, gửi lại outbox kẹt. Job phải idempotent, chạy ở worker process, có log số bản ghi đã sửa (số này tăng là tín hiệu có lỗi ở nơi khác).
