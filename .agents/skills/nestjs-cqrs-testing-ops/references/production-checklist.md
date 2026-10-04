# Checklist production cho NestJS CQRS

Đánh dấu từng mục. Mục nào chưa làm thì ghi rõ lý do chấp nhận rủi ro.

## Thiết kế

- [ ] Mỗi command/query có đúng một handler, đặt tên và thư mục theo quy ước.
- [ ] Command không trả aggregate/entity; trả `void`, id hoặc DTO nhỏ.
- [ ] `userId`/`tenantId` lấy từ context xác thực, không từ payload client.
- [ ] Query không side effect, đọc thẳng read repository, **có phân trang và giới hạn trần**.
- [ ] Không handler nào gọi bus khác (không chuỗi). Logic dùng chung nằm ở domain service.
- [ ] Không handler request-scoped.
- [ ] Domain không import `@nestjs/*` hay thư viện hạ tầng.

## Giao dịch và đồng thời

- [ ] Một command = một transaction = một aggregate (ngoại lệ có ghi chú).
- [ ] Optimistic locking bằng `version`; `affected = 0` → `ConcurrencyException`.
- [ ] Dispatcher retry **chỉ** `ConcurrencyException`, tối đa 3 lần, có jitter.
- [ ] Không có side effect ngoài DB (HTTP, email, emit) bên trong transaction hoặc trước commit.
- [ ] Transaction ngắn; `statement_timeout` và `lock_timeout` được cấu hình ở DB.

## Idempotency

- [ ] Command idempotent tự nhiên nếu có thể (join/leave là no-op khi trạng thái đã đúng).
- [ ] Command không idempotent có `requestId`, ghi vào hợp đồng client.
- [ ] Thao tác quan trọng (tiền, quota) dùng ràng buộc DB trong cùng transaction.

## Event và outbox

- [ ] Việc mà mất là bug (revoke token, email, thanh toán, đồng bộ) đi qua **outbox**, không dùng `@OnEvent`/`EventBus` in-process.
- [ ] Event được ghi outbox trong cùng transaction với aggregate; không publish trước commit.
- [ ] Relay chạy, có cơ chế thứ tự theo aggregate (một relay hoặc phân vùng).
- [ ] Mọi consumer idempotent (inbox/dedupe theo `eventId` hoặc version guard).
- [ ] Dead-letter có cảnh báo và quy trình xử lý tay.
- [ ] Job dọn outbox/inbox cũ.
- [ ] Event có `eventId`, `aggregateId`, `occurredAt`, `schemaVersion`; thay đổi schema chỉ thêm field.
- [ ] `UnhandledExceptionBus` reporter được gắn; event handler tự bắt lỗi.
- [ ] Không có fire-and-forget `commandBus.execute` trong event handler.
- [ ] Nếu nhiều instance: Socket.IO Redis adapter đã cài; event có thể phát từ process khác tới được socket.

## Lỗi

- [ ] Handler ném `DomainException` với `ErrorCode`; không trả `{ error }`.
- [ ] Exception filter dùng chung `normalizeError`; lỗi lạ không lộ message gốc.
- [ ] Lỗi event handler/saga có đường xử lý riêng (không dựa vào filter).
- [ ] Hợp đồng lỗi với client (`code`, `data`) được ghi tài liệu.

## Quan sát

- [ ] Metrics theo command/query: tổng, thời lượng (histogram), outcome, số retry.
- [ ] Metrics outbox: pending, tuổi cũ nhất, dead-letter, độ trễ publish.
- [ ] Log có cấu trúc kèm `correlationId`, `actorId`.
- [ ] Cảnh báo cho dead-letter, outbox trễ, tỉ lệ `system_error`, p99.
- [ ] Label metrics không chứa id.

## Test

- [ ] Unit test mọi handler bằng fake, không dựng bus.
- [ ] Test Dispatcher: retry, không retry lỗi khác, ghi outcome.
- [ ] Test wiring: mỗi command có handler, handler đã đăng ký, app khởi tạo được.
- [ ] Test outbox: ghi cùng transaction, rollback thì không có event, relay retry, consumer nhận trùng.
- [ ] Test đồng thời: hai command song song trên cùng aggregate.
- [ ] Lint kiến trúc trong CI (không import bus trực tiếp ở transport, domain thuần).

## Vận hành

- [ ] Graceful shutdown: dừng nhận kết nối, đợi handler đang chạy, dừng relay, dọn timer.
- [ ] Health check kiểm tra DB, Redis, và độ trễ outbox.
- [ ] Rolling deploy được kiểm tra: không mất event, không trùng tác dụng, client reconnect có backoff.
- [ ] Migration schema tương thích ngược (expand/contract) khi đổi bảng aggregate hoặc outbox.
- [ ] Runbook: xử lý dead-letter, rebuild read model, replay event, rollback.
- [ ] Load test với tải gần thực tế; chaos test kill process giữa chừng.
