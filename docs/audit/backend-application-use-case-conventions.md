# Backend application use-case conventions

Quy ước này là khuôn chung để thiết kế handler/use case trong backend. `reading-rooms` là module tham chiếu ban đầu; không có nghĩa mọi use case phải dùng transaction, retry hay idempotency.

Các quy ước về read repository bên dưới áp dụng cho **mọi feature trong backend**. Reading Rooms là ví dụ đầu tiên, không phải một kiến trúc riêng. Mỗi feature vẫn tự viết filter, projection và pipeline theo dữ liệu của nó, nhưng chữ ký phân trang, kiểu kết quả, cách xử lý không tìm thấy, ranh giới read/write và quy tắc đặt helper phải theo cùng khuôn. Khác biệt chỉ được giữ khi có lý do nghiệp vụ hoặc consistency cụ thể và được ghi rõ.

## 1. Luật phụ thuộc và trách nhiệm

- `presentation` nhận request/event, xác thực payload và danh tính, gọi application, rồi map lỗi/kết quả sang HTTP hoặc WebSocket.
- `application` điều phối use case, kiểm tra quyền theo tài nguyên, gọi domain và các port cần thiết. Handler không import adapter Mongo, Redis, queue hay SDK bên ngoài.
- `domain` sở hữu invariant và chuyển trạng thái hợp lệ của aggregate.
- `infrastructure` triển khai repository/port và các thao tác persistence/side effect.
- Port thuộc về lớp/use case tiêu thụ abstraction. Adapter phụ thuộc vào port để implement; module cấu hình nối hai bên.

Không tạo service, port, result hay transaction chỉ để có thêm một lớp. Tạo abstraction khi nó đặt đúng ranh giới hoặc loại bỏ logic lặp có thật.

### Nơi khai báo kiểu kết quả handler/query

- Mỗi feature gom application output contracts vào một file `<feature>.result.ts` ngay trong `application/`.
- Command/query và handler chỉ tham chiếu các kiểu trong file đó; không khai báo result inline hoặc đặt result riêng lẻ trong thư mục use case.
- Nếu query trả về kiểu application đã có, tái sử dụng kiểu đó; không tạo alias chỉ để đổi tên.
- Read-repository port có thể tham chiếu kiểu kết quả query, nhưng không tự định nghĩa lại output contract. Port chỉ tự khai báo model đọc nội bộ mà handler cần để quyết định nghiệp vụ.
- Nếu query trả về public read model từ feature khác, dùng trực tiếp kiểu public đó thay vì tạo wrapper trùng nghĩa.

## 2. Chọn mẫu trước khi viết handler

### Khuôn cấu trúc cho Query

Mọi query trong một feature dùng cùng cấu trúc thư mục và cặp file; không đặt query/handler ở vị trí khác nhau tùy người viết:

```text
application/queries/<query-name>/
  <query-name>.query.ts
  <query-name>.handler.ts
```

- `*.query.ts` chỉ chứa input cần để thực hiện việc đọc và khai báo kiểu output bằng `Query<Result>`.
- `*.handler.ts` luôn implement `IQueryHandler<Query, Result>` và có một `execute(query)` làm entry point.
- Trong handler, sắp import theo thứ tự: thư viện ngoài → shared → public API feature khác → code nội bộ feature → query cùng thư mục; dùng `import type` cho type-only dependency.
- Handler chỉ đọc qua read repository/public read API; nếu tài nguyên có quyền truy cập thì kiểm tra quyền tại đây. Sau đó trả application result đã khai báo trong `<feature>.result.ts`.
- Thân `execute()` theo một trình tự: đọc dữ liệu cần làm căn cứ → kiểm tra tồn tại/trạng thái/quyền → đọc dữ liệu phụ thuộc nếu cần → trả result. Bỏ bước không áp dụng; không tách thêm method/lớp chỉ để ép các handler có cùng số dòng.
- Handler không ghi dữ liệu, phát event, enqueue job hoặc trả HTTP DTO. Query không cần kiểm tra quyền thì handler chỉ chuyển input sang read repository và trả kết quả.
- Phân trang và giới hạn kích thước được đưa vào query từ presentation; repository áp dụng chúng trong truy vấn DB. Không tải hết dữ liệu để phân trang trong handler.
- Không tạo file result riêng cho từng query. Nếu một query cần kiểu đọc nội bộ để quyết định quyền, kiểu đó thuộc read-repository port; nếu là output của handler, dùng feature result.

Ví dụ tối thiểu:

```ts
@QueryHandler(GetRoomQuery)
export class GetRoomHandler implements IQueryHandler<GetRoomQuery, GetRoomResult> {
  constructor(private readonly roomReadRepository: IRoomReadRepository) {}

  async execute(query: GetRoomQuery): Promise<GetRoomResult> {
    const room = await this.roomReadRepository.findByCode(query.code);
    if (!room) throw new NotFoundDomainException('Room not found');
    return room;
  }
}
```

Reading Rooms hiện đã có cùng hình dạng thư mục cho năm query: mỗi thư mục có một `*.query.ts` và một `*.handler.ts`. Khác biệt giữa handler chỉ nằm ở bước quyền truy cập, phân trang hoặc gọi public read API; không phải mỗi query tự chọn một kiểu tổ chức riêng.

### Khuôn triển khai read repository

- Tách repository đọc khỏi aggregate repository: aggregate repository phục vụ load/save entity cho command; read repository trả projection/read model cho query. Không trộn hai trách nhiệm vào một interface.
- Trong một read repository, giữ các query cùng sở hữu collection/schema ở chung adapter. Public method khai báo rõ kiểu trả về; chi tiết riêng của query (filter, sort, projection và pipeline) vẫn nhìn thấy ngay tại method đó.
- Dùng các dạng thực thi có tên rõ theo hình dạng kết quả:
  - **Một read model:** pipeline/query → lấy một row hoặc `null` → map.
  - **Một trang:** filter/sort/page → lấy items và total; các query có cùng pipeline có thể dùng private helper.
  - **Một trang con trong document:** áp filter quyền và cắt trang trong cùng query nếu có thể.
- Tái sử dụng helper khi có phần thực thi lặp thật sự; không tạo base repository hay helper tổng quát che mất filter và pipeline cụ thể.
- Dùng projection/`select` để chỉ đọc các field read model cần; không tải cả record nếu query chỉ cần một phần.
- Danh sách có giới hạn phải sort ổn định bằng unique tiebreaker. Query filter/sort phải có index phù hợp; kiểm tra execution plan trên PostgreSQL trước khi kết luận hiệu năng.
- Dùng `PageParams` chung cho mọi hàm phân trang. `null` biểu thị không có tài nguyên/không đạt điều kiện truy cập; danh sách không có phần tử vẫn trả page rỗng. Repository không bắt lỗi DB thành kết quả “không tìm thấy”.
- Khi join collection của feature khác, chỉ dùng quy ước đã được quyết định cho module; join phải dựa trên đủ khóa quan hệ và có fallback được định nghĩa nếu dữ liệu tham chiếu không còn.

Reading Rooms là module mẫu cho khuôn này: `ReadingRoomRepository` giữ thao tác aggregate; `ReadingRoomReadRepository` giữ projection đọc; hai danh sách dùng `findSummaries`, còn thao tác lấy một row dùng chung helper `aggregateFirst` khi có thể.

| Mẫu | Dùng khi | Khuôn mặc định |
| --- | --- | --- |
| **Query** | Chỉ đọc | Dùng read repository/model; không sửa dữ liệu; kiểm tra quyền nếu query đọc tài nguyên riêng tư; phân trang có giới hạn. |
| **Create** | Tạo tài nguyên | Xác thực tham chiếu; DB constraint là chốt uniqueness; idempotency key khi retry cùng request phải trả cùng kết quả hoặc tạo trùng gây hậu quả. |
| **Single aggregate mutation** | Một aggregate có invariant | Đọc mới → kiểm tra quyền/trạng thái → gọi hành vi domain → lưu có version. Chỉ retry concurrency conflict; mỗi lần retry phải đọc lại aggregate. |
| **Multi-document command** | Nhiều document phải cùng đúng | Bao các lần đọc/ghi liên quan trong `UnitOfWork`; không gọi dịch vụ ngoài hoặc phát event trong transaction callback. Side effect sau commit; dùng outbox khi không được phép mất event. |
| **External service** | Use case gọi AI/email/storage hoặc dịch vụ ngoài | Timeout và giới hạn tài nguyên; xử lý timeout như kết quả chưa biết; ghi kết quả có điều kiện/idempotent; chỉ dùng trạng thái `pending`/job khi client cần theo dõi hoặc phải phục hồi công việc. |

Queue và WebSocket là **entry point**, không phải loại nghiệp vụ riêng. Handler phía sau vẫn chọn một trong các mẫu trên, cộng quy tắc giao nhận:

- Queue: idempotent; lỗi tạm thời được retry theo queue policy, lỗi vĩnh viễn không retry vô hạn.
- WebSocket: gateway xác thực/validate/throttle rồi gọi use case; ACK phân biệt rõ “đã hoàn tất” với “đã nhận để xử lý”.
- Ports cho Redis, queue, lock và các capability bên ngoài nằm dưới `application/ports/external/`; nhóm này thể hiện loại phụ thuộc, không phải nơi gọi. Infrastructure implement các abstraction này.

## 3. Quy tắc bảo vệ consistency

- Dùng DB unique constraint cho uniqueness; truy vấn kiểm tra trước chỉ cải thiện thông báo, không thay constraint.
- Dùng atomic conditional update khi invariant diễn đạt được trong một thao tác DB.
- Dùng optimistic version cho aggregate có thể bị nhiều request cùng sửa. `withOptimisticRetry` chỉ retry `ConcurrencyException`, có giới hạn, backoff/jitter và callback phải tải trạng thái mới mỗi lần.
- Chỉ dùng transaction khi nhiều thao tác DB phải commit/rollback cùng nhau. Mọi repository tham gia phải dùng cùng session do `UnitOfWork` quản lý.
- Không gọi Redis, queue, AI hay emit event bên trong transaction/retry callback. Side effect sau commit có thể mất nếu process chết giữa commit và publish; nếu không chấp nhận được, ghi outbox cùng transaction.
- Idempotency gồm key ổn định theo request, claim nguyên tử/unique constraint, fingerprint và kết quả để replay. Không thêm chỉ vì handler là create; chọn theo hậu quả của request trùng và khả năng client retry.

## 4. Kết quả, lỗi và phân trang

- Command/query handler trả application `Result` hoặc kiểu dữ liệu thuần mà controller tiêu thụ; không trả HTTP DTO từ application.
- Query list luôn giới hạn kích thước. Offset phù hợp danh sách nhỏ/cần total; cursor phù hợp danh sách lớn hoặc thay đổi liên tục. Không tải toàn bộ collection để bọc metadata.
- Application ném lỗi có nghĩa nghiệp vụ/ứng dụng; presentation/filter chuyển chúng thành HTTP/WS contract. Không để lỗi Prisma/PostgreSQL/Redis/SDK thô trở thành contract công khai.
- Query có kiểm tra quyền tài nguyên phải có test cho cả được phép và bị từ chối; đây là ranh giới bảo vệ dữ liệu.

## 5. Mức kiểm thử tối thiểu theo mẫu

| Mẫu | Hành vi cần bảo vệ |
| --- | --- |
| Query | Mapping/filter/pagination; quyền tài nguyên nếu có. |
| Create | Tham chiếu không hợp lệ; uniqueness; retry cùng idempotency key nếu use case yêu cầu. |
| Single aggregate mutation | Invariant domain; version conflict; retry đọc lại; hết số lần retry. |
| Multi-document | Cùng commit/rollback; không phát side effect trước commit. |
| External service | Timeout, lỗi provider, request trùng, ghi kết quả cạnh tranh; lock chỉ là tối ưu nếu DB có conditional write bảo vệ cuối cùng. |
| Queue/WebSocket entry | Duplicate delivery/ACK semantics và lỗi biên tương ứng. |

Không ép mọi test vào cùng một dạng file nếu hành vi không áp dụng. Thiếu test phải được nêu rõ trong review.

## 6. Áp dụng làm mẫu: Reading Rooms

| Handler | Mẫu | Cơ chế chính | Điểm cần giữ/kiểm chứng |
| --- | --- | --- | --- |
| `CreateRoomHandler` | Create + multi-document | `UnitOfWork`, touch tham chiếu Book/Chapter, unique room code/request key, fingerprint và replay | Room và các touch cùng transaction; collision phải được phân loại đúng theo index. |
| `JoinRoomHandler` | Single aggregate mutation | Domain membership rule + version/retry | Retry phải đọc room mới; WS join/presence là bước giao nhận sau command. |
| `LeaveRoomHandler` | Single aggregate mutation | Domain chuyển member/host/room state + version/retry | Xác định no-op/idempotency cho member đã rời. |
| `ReactivateRoomHandler` | Single aggregate mutation | Domain kiểm tra host/state + version/retry | Active là no-op thành công; host không còn member hoạt động thì lỗi theo quyết định domain. |
| `AddHighlightHandler`, `RemoveHighlightHandler` | Single aggregate mutation | Domain kiểm tra quyền sở hữu/trạng thái + version/retry | Quyền sau khi member rời phòng cần theo policy sản phẩm. |
| `GetMyActiveRoomsHandler`, `GetMyHistoryHandler`, `GetRoomHighlightsHandler` | Query | Read repository + giới hạn offset pagination | Không hydrate aggregate nếu chỉ cần projection đọc. |
| `GetRoomByCodeHandler` | Query | Read model theo quyền; trả preview cho non-member | Test phải bảo đảm preview không lộ trường private. |
| `GetCurrentRoomChapterHandler` | Query | Xác minh membership rồi đọc chapter qua public API | Book/chapter soft-delete policy cần đồng bộ với quyền thành viên room. |
| `GenerateHighlightInsightHandler` | External service + conditional write | Member check, lock chống gọi AI trùng, timeout/abort, `setIfEmpty`, phát realtime event sau khi lưu | Redis lock giảm trùng nhưng không là correctness boundary; conditional write bảo vệ kết quả. Event hiện là realtime và có thể khôi phục bằng đọc lại; nếu phải đảm bảo giao nhận thì cần outbox. |

### Quy ước chọn và đọc port

Port được phân loại theo **trách nhiệm của hợp đồng**, không theo từng handler. Khi đọc một port, người đọc phải xác định được ai tiêu thụ nó, vì sao abstraction tồn tại, và bảo đảm nào thuộc về nó.

| Loại hợp đồng | Đặt ở đâu | Dùng khi | Reading Rooms |
| --- | --- | --- | --- |
| Aggregate repository | `domain/repositories/` | Command cần tải/lưu aggregate để thực thi invariant domain. Chỉ thêm thao tác persistence gắn với aggregate. | `IReadingRoomRepository` |
| Persistence port | `application/ports/persistence/` | Query read model hoặc thao tác ghi DB đặc biệt. Store chỉ dành cho atomic/unique semantics mà aggregate repository không thể biểu đạt an toàn. | `IReadingRoomReadRepository`, `ICreateRoomStore`, `IHighlightInsightStore` |
| External capability port | `application/ports/external/` | Application hoặc presentation cần Redis, queue, lock hay capability bên ngoài khác. Vị trí này mô tả loại phụ thuộc, không phải consumer. | `IPresenceCachePort`, `IReadingProgressQueuePort`, `IHighlightInsightLockPort` |
| Public feature API | `application/public-api/` | Feature khác cần gọi capability do feature này cung cấp. Consumer chỉ import qua `index.ts`. | `IReadingRoomReferencePort` |

Quy tắc thêm port:

1. Trước tiên xác định consumer: domain command, query handler, realtime presentation, hay feature khác.
2. Tái sử dụng aggregate repository cho load/save aggregate; read repository cho truy vấn projection thông thường.
3. Chỉ tạo `Store` khi cần bảo đảm ghi nguyên tử hoặc uniqueness mà repository aggregate không thể giữ. Ghi rõ điều kiện nguyên tử nằm ở database nào.
4. Dùng `Port` cho capability bên ngoài hoặc capability public giữa feature. Không tạo một port riêng chỉ vì mỗi handler muốn một interface một method.
5. Thể hiện mục đích bằng tên hợp đồng và vị trí thư mục; adapter triển khai ở infrastructure. `index.ts` chỉ export capability mà feature chủ động công khai.

Reading Rooms là ví dụ cho các loại trên. Các interface hiện có không phải cùng một loại abstraction: tên `Repository`, `Store`, `LockPort`, `QueuePort` thể hiện mục đích khác nhau; vị trí thư mục thể hiện consumer/ranh giới. `IReadingRoomReferencePort` nằm trong `application/public-api/` vì Books/Chapters tiêu thụ nó như API của feature. Khi module khác cần một loại capability tương tự, dùng cùng quy tắc phân loại và cách đặt tên này, không sao chép cấu trúc riêng của Reading Rooms một cách máy móc.

Khi có handler mới, ghi tên mẫu và invariant cần bảo vệ trong design note/PR. Chỉ thêm cơ chế khi checklist chỉ ra failure mode thực tế.

## 7. Khuôn triển khai domain repository

Áp dụng cho repository làm việc với aggregate; không áp dụng máy móc cho read repository hoặc các data-access class khác.

- Hợp đồng nằm trong `domain/repositories/`; implementation nằm trong `infrastructure/<persistence>/repositories/`.
- `findById` nhận ID domain, trả aggregate hoặc `null`; mapper chuyển persistence record thành aggregate. Không trả Prisma model ra ngoài infrastructure.
- `save` có cùng ba nhánh: aggregate mới thì insert; aggregate cũ không dirty thì no-op; aggregate cũ có thay đổi thì conditional update theo `id + loadedVersion`.
- Insert đặt version ban đầu rõ ràng. Update tăng version và nếu không match thì ném `ConcurrencyException`; application mới quyết định retry, mỗi lần retry phải tải aggregate mới.
- Chỉ chuyển duplicate-key thành lỗi nghiệp vụ khi xác định đúng constraint/index; các lỗi persistence khác được giữ nguyên.
- Unit of Work sở hữu transaction. Prisma Unit of Work cung cấp transaction client theo context hiện hành; mọi repository tham gia phải dùng client đó để cùng transaction.
- Repository có thể đánh dấu aggregate đã persist sau khi lệnh ghi thành công. Nếu transaction thất bại, không tái sử dụng instance aggregate đó; lần chạy lại phải tải lại aggregate mới.
- Mapper nhận kiểu record Prisma ở biên infrastructure và trả aggregate/read model của ứng dụng; không để kiểu Prisma lan sang application hoặc presentation.

`ReadingRoomRepository` là ví dụ cho khuôn này. Nếu collection có dữ liệu legacy thiếu version thì phải có migration hoặc nhánh tương thích riêng; không thêm nhánh đó nếu dữ liệu không có trường hợp legacy.
