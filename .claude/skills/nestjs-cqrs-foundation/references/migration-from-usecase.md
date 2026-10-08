# Chuyển từ `XxxUseCase.execute(command)` sang bus + handler

Làm dần, mỗi use case một commit, build và test pass sau mỗi commit.

## Quy trình

1. Cài `@nestjs/cqrs`, import `CqrsModule.forRoot()` ở `AppModule`.
2. Chọn **một** use case nhỏ làm thử (ví dụ `JoinRoomUseCase`).
3. Đổi class use case thành handler:
   - Thêm `@CommandHandler(JoinRoomCommand)`.
   - `implements ICommandHandler<JoinRoomCommand, Result>`.
   - Giữ nguyên thân `execute`. Thường chỉ cần đổi chữ ký nhận command.
4. Nếu command hiện không có kiểu kết quả, cho nó `extends Command<Result>` và `super()` trong constructor.
5. Đăng ký handler vào `providers` của module.
6. Đổi nơi gọi: `this.joinRoom.execute(cmd)` → `this.bus.command(cmd)` (hoặc `commandBus.execute(cmd)` nếu chưa có Dispatcher).
7. Chạy test, thêm unit test cho handler (xem skill testing-ops).
8. Lặp lại cho các use case còn lại.
9. Khi xong: xóa các `XxxUseCase` cũ, constructor gateway chỉ còn `Dispatcher`.

## Phân loại use case hiện có

| Use case làm gì | Chuyển thành |
|---|---|
| Thay đổi trạng thái | Command + CommandHandler |
| Chỉ đọc | Query + QueryHandler (đọc thẳng read repository, bỏ qua aggregate) |
| Vừa ghi vừa trả nhiều dữ liệu | Tách: Command trả id/DTO nhỏ, client gọi Query để lấy chi tiết |

## Những thứ cần rà khi chuyển

- Use case nào gọi use case khác: thay bằng domain service hoặc domain event (quy tắc 3).
- Use case trả entity: đổi sang DTO.
- Use case lấy `userId` từ payload: đổi sang context đã xác thực.
- Use case có logic transaction/retry tự viết: gom về UnitOfWork và Dispatcher (skill pipeline).
- Chỗ nào bắt lỗi rồi trả object lỗi: đổi thành ném `DomainException`.

## Dấu hiệu làm sai

- Handler inject `CommandBus` (đang chuỗi handler).
- Command có field kiểu entity hoặc `Request`.
- Test handler phải dựng cả `CqrsModule` mới chạy được (handler đang phụ thuộc bus).
- Quên đăng ký handler: báo lỗi lúc chạy. Thêm test wiring (skill testing-ops).
