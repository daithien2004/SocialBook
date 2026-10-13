# Kế hoạch chuyển backend từ MongoDB sang PostgreSQL

## Quyết định và phạm vi

- PostgreSQL trở thành database nghiệp vụ chính; database PostgreSQL ban đầu rỗng, không import dữ liệu MongoDB hiện tại.
- ORM và migration tool: Prisma 7; backend yêu cầu Node.js `>=22.12.0`.
- Redis vẫn phục vụ cache, presence và BullMQ; ChromaDB vẫn phục vụ vector search.
- Giữ cấu trúc feature-first, domain, application, infrastructure, presentation và các port hiện có. Chỉ thay adapter persistence và phần composition/configuration liên quan database.
- Dùng Prisma 7 làm PostgreSQL persistence toolkit và migration tool. Prisma Client chỉ được dùng trong `core/database` và các adapter thuộc infrastructure.
- Dùng UUID cho entity ID và foreign key; PostgreSQL lưu bằng kiểu `uuid`. Room code là mã nghiệp vụ riêng, tiếp tục dùng chuỗi ngắn.

## Không làm

- Đây là chuyển đổi trực tiếp trước khi deploy: không dual-write và không cần giữ tương thích dữ liệu MongoDB.
- Vì PostgreSQL là database mới trước khi deploy, không cần dual-write hoặc giữ MongoDB runtime để tương thích dữ liệu cũ.
- Không chuyển Redis, BullMQ hoặc ChromaDB sang PostgreSQL.
- Không đưa Prisma model/client vào domain hoặc application.

## Quy tắc dữ liệu

- Quan hệ nghiệp vụ cần kiểm tra tồn tại hoặc truy vấn độc lập được mô hình hóa thành bảng và foreign key.
- Mảng nhúng có vòng đời, phân trang hoặc cập nhật đồng thời riêng được cân nhắc thành bảng con. Chỉ dùng JSONB cho dữ liệu thực sự là payload/snapshot, không cần quan hệ hay truy vấn theo từng phần tử.
- Unique index, partial uniqueness, soft-delete và thứ tự phân trang phải được thể hiện bằng constraint/index và query PostgreSQL tương ứng.
- Aggregate mutation giữ optimistic version ở document/table aggregate; thao tác ghi đặc thù phải tăng version hoặc có điều kiện atomic tương đương.

## Quyết định cho dữ liệu nhúng Mongo

Không chuyển mảng Mongo thành JSONB một cách máy móc. Chọn kiểu lưu theo vòng đời và cách truy vấn:

| Dữ liệu hiện tại | Hướng PostgreSQL | Lý do |
| --- | --- | --- |
| `User.favoriteGenres` | Bảng nối `user_favorite_genres` | Tham chiếu Genre; cần FK và truy vấn theo genre. |
| `Book.genres`, `Book.likedBy` | Bảng nối | Quan hệ nhiều-nhiều; cần lọc/tổng hợp theo từng quan hệ. |
| `Chapter.paragraphs` | Bảng `paragraphs` có `chapterId`, `orderIndex` và ID riêng | Paragraph có ID được highlight tham chiếu, có thứ tự và được đọc theo chapter. |
| `ReadingRoom.members`, `ReadingRoom.highlights` | Bảng riêng | Member cần truy vấn/đồng bộ độc lập; highlights được phân trang và cập nhật insight riêng. |
| `ReadingList.collectionIds`, `Review.likedBy` | Bảng nối | Đây là quan hệ tới collection/user và cần ràng buộc toàn vẹn. |
| `ChapterKnowledge.entities/relationships` | JSONB trong giai đoạn đầu | Được nạp/lưu như một snapshot tri thức theo chapter; chưa thấy use case cần CRUD hoặc phân trang từng node/edge. Chuyển thành bảng nếu truy vấn/ghi từng node trở thành yêu cầu. |
| `Book.tags`, `Post.imageUrls` | PostgreSQL array | Danh sách giá trị đơn giản, chưa có ID hay vòng đời độc lập; giữ nguyên thứ tự ở image URLs. |

Đây là quyết định theo các truy vấn và thao tác hiện thấy trong source. Khi chuyển từng feature, kiểm tra lại các use case và index thay vì coi lựa chọn JSONB/array là mặc định chung.

## Transaction

- `UnitOfWorkPort` tiếp tục là hợp đồng application dùng chung. Feature đã migrate phải bind token này với `PrismaUnitOfWork`; không để handler ghi PostgreSQL nhưng nhận implementation Mongo từ provider global.
- Transaction Prisma dùng `nestjs-cls` và `TransactionHost`; repository truy cập transaction client theo context hiện hành.
- Side effect ngoài PostgreSQL (Redis, queue, AI, socket) chạy sau commit. Outbox dùng khi không được phép mất event/job.
- Khi transaction retry, callback phải tải lại aggregate; không dùng lại instance đã được đánh dấu persisted từ lần chạy trước.
## Thứ tự thực hiện

1. Thay MongoDB bằng PostgreSQL trong local/CI, thiết lập Prisma 7 schema và migration baseline; bổ sung config, health check và seed tối thiểu.
2. Chốt thiết kế bảng, khóa ngoại, unique constraint và ID cho toàn bộ bounded context trước khi chuyển adapter.
3. Chuyển các module nền tảng có quan hệ phụ thuộc trước: users/roles, authors/genres, books, chapters.
4. Chuyển các module nghiệp vụ còn lại theo nhóm phụ thuộc; giữ nguyên port để application không phụ thuộc Prisma.
5. Chuyển seeds, scripts, health checks, outbox/job persistence và các aggregation/query riêng sang SQL/Prisma.
6. Xóa Mongoose, MongoDB adapters, transaction helpers, env/config và Docker Mongo chỉ sau khi không còn import/runtime dependency.
7. Chạy typecheck, lint, boundary check, test adapter/repository và toàn bộ backend check; đối chiếu OpenAPI để bảo đảm response không đổi ngoài chủ ý.

## Trạng thái hiện tại

- Backend dùng PostgreSQL với Prisma 7 cho persistence nghiệp vụ; các feature runtime, worker và seed đã được chuyển sang Prisma.
- Đã chuyển users/roles, authors/genres, books/chapters, reading rooms, library, reviews, analytics/recommendations, bookmarks, moderation, user highlights, notifications, text-to-speech, chapter knowledge, AI request/configuration và social features (posts/comments/likes/follows).
- Entity ID và foreign key dùng UUID; `IsUUID` xác thực ID tại HTTP boundary và Zod xác thực payload queue. Room code và các khóa cấu hình không phải entity ID nên giữ kiểu chuỗi riêng.
- Mongoose/MongoDB runtime, adapters, schemas, seeders, transaction helpers, package dependencies, environment config và Compose service đã được gỡ khỏi backend.
- Redis, BullMQ và ChromaDB vẫn là hạ tầng riêng cho cache/presence, job và vector search.
- PostgreSQL là database mới, không import dữ liệu Mongo. Chưa chạy `prisma migrate deploy`; Docker daemon hiện không truy cập được trong môi trường làm việc này.
- Backend `npm run check --workspace=backend` đã qua: typecheck, lint, boundary check và Jest (31 suites passed, 1 skipped).
- Frontend typecheck đã qua. Frontend lint không có lỗi nhưng còn 9 cảnh báo đã tồn tại ở UI.
- Prisma Client đã generate và schema đã validate trước đó; migration cần được áp dụng, rồi kiểm tra repository/transaction trên PostgreSQL thật trước deploy.

## Điều kiện hoàn tất

- Không còn dependency/import/config/runtime service MongoDB trong backend; ID persistence và API đều dùng UUID.
- Tất cả feature repository và read query dùng PostgreSQL adapter.
- Transaction, unique constraint, concurrency và retry cần được kiểm chứng với PostgreSQL thật trước khi deploy. Phần này còn chờ môi trường PostgreSQL.
- Redis, BullMQ, ChromaDB và API contract vẫn hoạt động theo đúng vai trò hiện tại.
