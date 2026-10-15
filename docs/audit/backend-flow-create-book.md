# Backend hiện tại qua một luồng: tạo sách

Tài liệu này lần theo **một request tạo sách thật trong code**. Mục tiêu là hiểu các phần đang phối hợp ra sao, không khẳng định mọi feature đều đã dùng cùng một pattern. Đường dẫn tính từ gốc repository.

## Vì sao chọn luồng này?

`POST /api/v1/books` chạm vào nhiều thành phần backend trong một request: xác thực, phân quyền, multipart upload, DTO, CQRS, domain entity, transaction, repository Prisma, giao tiếp với Authors/Genres, outbox, cache, query đọc lại và response DTO.

Đây là luồng tương đối giàu thành phần để làm bản đồ đọc code. Một số điểm riêng của nó, như upload ảnh và tạo author/genre ngay trong lúc tạo sách, không phải feature nào cũng có.

## Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Nest as NestJS HTTP
    participant Guards as Global + route guards
    participant Controller as BooksController
    participant Bus as CommandBus / QueryBus
    participant Handler as CreateBookHandler
    participant Domain as Book entity + value objects
    participant Repo as BookRepository
    participant DB as PostgreSQL / Prisma
    participant External as Media + Redis cache
    participant Worker as Chroma outbox relay / worker

    Client->>Nest: POST /api/v1/books (multipart/form-data)
    Nest->>Guards: JWT, throttle, CSRF, role, CASL policy
    Guards-->>Nest: Cho request tiếp tục hoặc trả lỗi
    Nest->>Controller: Validate DTO, parse file
    Controller->>Bus: execute(CreateBookCommand)
    Bus->>Handler: gọi handler đã đăng ký
    Handler->>External: upload ảnh (nếu có)
    Handler->>DB: Transaction bắt đầu
    Handler->>Bus: tìm/tạo author và genre nếu cần
    Handler->>Domain: tạo Book qua Book.create()
    Handler->>Repo: save(Book)
    Repo->>DB: INSERT book và quan hệ
    Handler->>DB: ghi BookOutbox cùng transaction
    DB-->>Handler: transaction commit; trả book id
    Handler->>External: cập nhật cache sau commit
    Handler-->>Bus: trả book id
    Controller->>Bus: execute(GetBookByIdQuery)
    Bus->>Repo: đọc theo id + CASL ability
    Repo->>DB: SELECT sách và quan hệ cần cho response
    Repo-->>Controller: BookListReadModel
    Controller-->>Client: 201 + BookResponseDto
    Worker->>DB: đọc/claim outbox event
    Worker-->>Worker: enqueue job lập chỉ mục sách
```

Sơ đồ lược bỏ chi tiết lỗi và các bước framework nội bộ. Các phần bên dưới giải thích từng chặng.

## 1. Ứng dụng được ghép ở đâu?

Khi API khởi động, [`main.ts`](../../backend/src/main.ts) tạo Nest application từ [`AppModule`](../../backend/src/app.module.ts). `AppModule` nạp `CoreModule` và các feature module.

`CoreModule` gom hạ tầng dùng chung ở [`core.module.ts`](../../backend/src/core/core.module.ts): cấu hình, PostgreSQL/Prisma, Redis, queue, logging, CQRS, security và health. Phần kết nối PostgreSQL được tạo bởi [`PrismaService`](../../backend/src/core/database/postgres/prisma.service.ts). Cấu hình CLS gắn `@nestjs-cls/transactional` với Prisma để repository lấy transaction hiện hành.

[`BooksModule`](../../backend/src/modules/books/books.module.ts) ghép controller và phần application của Books. [`BooksApplicationModule`](../../backend/src/modules/books/application/books/books-application.module.ts) đăng ký `CreateBookHandler`, query handlers, repository module và các module tích hợp mà use case cần. `BooksRepositoryModule` bind port `IBookRepository` với implementation `BookRepository`.

Nói ngắn gọn: Nest đọc metadata module để biết controller, handler và adapter nào tồn tại, rồi inject đúng implementation khi khởi tạo.

## 2. Request vào API và qua các lớp bảo vệ

Controller khai báo `@Controller('books')`; `main.ts` đặt prefix `api` và URI version mặc định `1`. Vì vậy endpoint là:

```text
POST /api/v1/books
```

Request tạo sách nhận dữ liệu multipart để có thể kèm ảnh bìa. Method `create()` nằm trong [`books.controller.ts`](../../backend/src/modules/books/presentation/books/books.controller.ts), dùng `CreateBookDto` và decorator `@ApiFileUpload('coverUrl')`.

Ví dụ hình dạng request (giản lược; client gửi `multipart/form-data`):

```text
POST /api/v1/books
Authorization: Bearer <access-token>

title=The Example Book
authorId=<author-uuid>
genres=<genre-uuid-1>
genres=<genre-uuid-2>
coverUrl=<optional image file>
```

Nếu không upload file thì client có thể gửi URL cover bằng field `coverUrl`. Request cần có thông tin xác thực phù hợp với quyền tạo sách.

Các guard toàn cục được đăng ký trong [`security.module.ts`](../../backend/src/core/security/security.module.ts):

1. `JwtAuthGuard` xác thực JWT và cung cấp thông tin user cho request.
2. `UserThrottlerGuard` giới hạn tần suất.
3. `CsrfGuard` kiểm tra CSRF theo cấu hình ứng dụng.

Controller dùng `PoliciesGuard` và `@CheckPolicy` làm lớp phân quyền CASL. Ability của Book cấp quyền `manage Book` cho admin; JWT guard toàn cục vẫn xác thực danh tính. Legacy `RolesGuard`/`@RequireAuth` đã được gỡ để không duy trì hai cơ chế role song song.

`@ApiFileUpload` áp `FileInterceptor`: chỉ nhận MIME JPEG/PNG/WebP/AVIF và giới hạn 5 MB. Sau đó global `ValidationPipe` transform DTO, loại field ngoài whitelist và từ chối field lạ. Các rule cụ thể như tiêu đề dài 5–200 ký tự và 1–5 genres nằm trong [`create-book.dto.ts`](../../backend/src/modules/books/presentation/books/dto/create-book.dto.ts).

`PoliciesGuard` dựng `Actor` từ user đã xác thực rồi lưu vào request. `@CurrentActor()` đọc actor đó cho controller. Actor mang `userId`, `roles` và CASL `ability`; DTO dùng nó để tạo command.

`PoliciesGuard` dựng `Actor` từ user đã xác thực rồi lưu vào request; `@CurrentActor()` đưa actor vào controller. Actor mang roles và ability CASL của feature, còn `JwtAuthGuard` chỉ xác thực danh tính.

## 3. DTO chuyển request thành command

`CreateBookDto` là kiểu dữ liệu ở biên HTTP. Class-validator kiểm tra dữ liệu; một số field multipart được transform, ví dụ `genres` có thể được gửi thành một hay nhiều giá trị.

Controller không tự dựng từng field vào command. Nó gọi:

```ts
createBookDto.toCommand(actor, file)
```

`toCommand()` tạo `CreateBookCommand`, class thuần chứa actor và dữ liệu đã kiểm tra. Command khai báo kiểu kết quả là `string`: handler trả về ID sách, không trả Prisma model hay domain entity ra presentation.

## 4. CommandBus chuyển việc đến handler

Controller gọi `commandBus.execute(command)`. `@nestjs/cqrs` tìm `CreateBookHandler`, được đăng ký trong `BooksApplicationModule`, rồi gọi `execute()`.

Đến đây, controller đã làm xong việc của nó: nhận request, lấy actor, chuyển thành command, dispatch và định dạng response. Quy tắc nghiệp vụ và điều phối nhiều bước nằm trong application handler.

## 5. Handler điều phối nghiệp vụ

Handler nằm tại [`create-book.handler.ts`](../../backend/src/modules/books/application/books/commands/create-book/create-book.handler.ts). Luồng bên trong hiện tại:

1. Kiểm tra CASL `create Book`.
2. Kiểm tra số lượng genres nằm trong giới hạn nghiệp vụ.
3. Nếu request có file bìa, gọi `IMediaPort.uploadImage()` để tải ảnh lên dịch vụ media. Bước này diễn ra **trước transaction DB**.
4. Gọi private method `createBook()` có `@Transactional()`.
5. Sau khi method transaction hoàn tất, cập nhật Redis cache qua `IBookCachePort`.
6. Trả ID sách cho controller.

### Những gì xảy ra bên trong transaction

`createBook()` kiểm tra title đã tồn tại chưa, tìm hoặc tạo author và genres nếu request gửi tên mới, tạo domain entity `Book`, gọi repository để lưu sách, rồi ghi một bản ghi `BookOutbox` loại `book.created`.

Tìm/tạo author và genre được dispatch qua public command/query của module tương ứng (`Authors`, `Genres`), thay vì handler Books tự truy cập bảng của feature khác. Những lời gọi này diễn ra trong lúc transaction của `createBook()` đang hoạt động; các repository lấy client từ transaction context.

Outbox được ghi cùng transaction với sách. Nếu transaction rollback, cả sách lẫn outbox event đều rollback. Cache và dịch vụ media không nằm trong transaction PostgreSQL.

## 6. Domain entity chứa dữ liệu nghiệp vụ

[`Book`](../../backend/src/modules/books/domain/books/entities/book.entity.ts) được tạo qua `Book.create()`. Entity/value object kiểm tra và chuẩn hóa dữ liệu domain: title đi qua `BookTitle`, ID đi qua các value object, slug được sinh từ title, status có mặc định `draft`, bộ đếm views/likes bắt đầu từ 0.

Application handler quyết định *cần làm những bước nào*; domain entity quyết định *một Book mới hợp lệ được tạo ra như thế nào*. Entity không biết HTTP, Prisma hay PostgreSQL.

## 7. Repository và Prisma lưu dữ liệu

`IBookRepository` là hợp đồng ghi của domain. Implementation [`BookRepository`](../../backend/src/modules/books/infrastructure/repositories/books/book.repository.ts) nằm ở infrastructure và dùng `TransactionHost` để thao tác qua Prisma transaction hiện hành.

Khi `save()` nhận entity mới, repository gọi [`PrismaBookMapper.persistenceData()`](../../backend/src/modules/books/infrastructure/repositories/books/prisma-book.mapper.ts) để đổi domain shape thành Prisma create data. Repository tạo hàng `Book` cùng quan hệ genres/likes; sau khi ghi thành công entity được đánh dấu đã persist.

Điều cần phân biệt:

- Handler phụ thuộc vào domain repository port, không phụ thuộc Prisma.
- Repository implementation hiểu Prisma và schema DB.
- Mapper là nơi chuyển giữa domain shape và persistence shape.
- `TransactionHost` giúp các lần ghi trong transaction dùng chung transaction mà không truyền `tx` qua từng method.

## 8. Outbox chuyển việc lập chỉ mục sang worker

Trong transaction, handler thêm event vào [`BookOutboxRepository`](../../backend/src/modules/books/infrastructure/outbox/book-outbox.repository.ts). Đây là bản ghi PostgreSQL bền vững, không phải lời gọi Redis/queue ngay lúc đang tạo sách.

Worker chạy [`BookOutboxRelayCron`](../../backend/src/modules/chroma/infrastructure/queue/book-outbox-relay.cron.ts), claim các event đến hạn, thêm job `index-book` vào BullMQ với `jobId` ổn định và retry/backoff, rồi đánh dấu event đã publish. `ChromaModule` chỉ đăng ký relay/processor khi process chạy ở worker mode.

Job được xử lý bởi [`ChromaProcessor`](../../backend/src/modules/chroma/infrastructure/queue/chroma.processor.ts), chịu trách nhiệm cập nhật vector index. Vì vậy HTTP request tạo sách không cần đợi việc lập chỉ mục hoàn tất.

## 9. Đọc lại sách và tạo HTTP response

Sau khi command trả ID, controller lập tức gọi `queryBus.execute(new GetBookByIdQuery(actor, bookId))` để lấy dữ liệu trình bày.

`GetBookByIdHandler` gọi `BookReadRepository.findListById(ability, id)`. Implementation là `PrismaBookReadRepository`: truy vấn PostgreSQL, lọc bản ghi chưa xóa và kết hợp điều kiện CASL vào `where`. Nó map hàng DB thành `BookListReadModel` qua `PrismaBookMapper`.

Controller chuyển read model thành `BookResponseDto` bằng `BookResponseDto.fromReadModel()`. Đây là DTO HTTP; read model là kết quả đọc của application; Prisma row và entity không được trả thẳng cho client.

**Điểm đáng chú ý:** method controller này dispatch hai lần: một command để ghi, rồi một query để lấy dữ liệu response. Đây là cách flow đang chạy, nhưng khác khuôn skill muốn controller dispatch một command/query. Đừng suy ra các controller khác cũng phải đọc lại sau mỗi lệnh ghi.

POST mặc định trả `201 Created`. Swagger mô tả endpoint qua decorators trong controller; spec được phục vụ ở `/docs` và file OpenAPI được lưu ở `backend/openapi.json`.

## 10. Nếu một bước lỗi thì response đi đường nào?

`HttpExceptionFilter` toàn cục trong `SecurityModule` nhận lỗi cuối cùng và chuyển thành `application/problem+json` gồm `status`, `code`, `detail`, `traceId` và `errors` nếu là lỗi validation.

Ví dụ:

- DTO/file không hợp lệ → lỗi 400 (file quá lớn có thể thành 413).
- JWT thiếu hoặc sai → 401.
- Role/policy không cho phép → 403.
- Domain báo trùng hoặc dữ liệu không hợp lệ → filter ánh xạ domain error sang HTTP status.
- Unique constraint Prisma `P2002` → 409.
- Lỗi không nhận diện → 500 với thông điệp chung cho client; chi tiết ghi log kèm trace ID.

## 11. Các giới hạn của flow hiện tại

Đây là phần quan trọng để hiểu sự khác nhau giữa “đã có transaction” và “mọi side effect đều nguyên tử”:

1. **Upload ảnh xảy ra trước commit.** Nếu upload thành công nhưng transaction tạo sách thất bại, ảnh có thể còn lại trên storage. Handler hiện không bù trừ bằng `deleteImage()`.
2. **Cache chạy sau commit.** Nếu Redis lỗi, DB có thể đã lưu sách nhưng request vẫn trả lỗi. Client retry POST có thể tạo thêm sách vì flow này chưa dùng idempotency key.
3. **Controller query lại sau khi ghi.** Nếu truy vấn đọc hoặc map response lỗi sau commit, client có thể nhận lỗi dù sách đã được tạo.
4. **Kiểm tra title trước khi ghi không tự ngăn race.** Hai request đồng thời có thể cùng vượt qua `existsByTitle()`. Trong schema hiện tại `Book.title` và `Book.slug` không có unique constraint, nên muốn đảm bảo uniqueness cần quyết định constraint phù hợp ở DB.
5. **CASL `ForbiddenError` trong handler:** endpoint HTTP thường bị chặn trước bởi guard. Tuy nhiên `HttpExceptionFilter` hiện xử lý DomainException, Nest HttpException, Prisma và Multer; cần kiểm tra mapping nếu command này được gọi nội bộ với actor không có quyền.
6. **Quyền `create Book` được kiểm tra ở hai nơi:** `PoliciesGuard` kiểm tra policy của route, rồi `CreateBookHandler` kiểm tra cùng action trên command. Với action tạo không có resource cụ thể, điều kiện đang trùng nhau. Đây là điểm cần quyết định theo quy chuẩn CASL của dự án; không phải lý do để khôi phục `RolesGuard`.

Các điểm này không có nghĩa flow không dùng được; chúng chỉ chỉ ra transaction hiện bảo vệ phần ghi PostgreSQL trong method transaction, còn storage, Redis và HTTP response nằm ngoài transaction đó.

## 12. Cách tự lần flow khác

Khi đọc một endpoint khác, đi theo đúng thứ tự này:

1. Controller: route, DTO, guard/decorator, response type.
2. DTO: validate gì, tạo command/query nào.
3. Command/query: dữ liệu nào đi qua bus.
4. Handler: quy tắc, quyền, các bước điều phối và transaction.
5. Domain: entity/value object nào giữ invariant.
6. Port và adapter: handler cần hợp đồng gì, implementation thực hiện ở đâu.
7. Side effect: DB, Redis, queue, outbox, dịch vụ ngoài; xác định cái nào nằm trong transaction.
8. Response/error: mapper DTO và filter nào chuyển kết quả/lỗi cho client.

### File nên mở theo thứ tự

1. [`books.controller.ts`](../../backend/src/modules/books/presentation/books/books.controller.ts)
2. [`create-book.dto.ts`](../../backend/src/modules/books/presentation/books/dto/create-book.dto.ts)
3. [`create-book.command.ts`](../../backend/src/modules/books/application/books/commands/create-book/create-book.command.ts)
4. [`create-book.handler.ts`](../../backend/src/modules/books/application/books/commands/create-book/create-book.handler.ts)
5. [`book.entity.ts`](../../backend/src/modules/books/domain/books/entities/book.entity.ts)
6. [`book.repository.interface.ts`](../../backend/src/modules/books/domain/books/repositories/book.repository.interface.ts)
7. [`book.repository.ts`](../../backend/src/modules/books/infrastructure/repositories/books/book.repository.ts)
8. [`prisma-book.mapper.ts`](../../backend/src/modules/books/infrastructure/repositories/books/prisma-book.mapper.ts)
9. [`get-book-by-id.handler.ts`](../../backend/src/modules/books/application/books/queries/get-book-by-id/get-book-by-id.handler.ts)
10. [`prisma-book-read.repository.ts`](../../backend/src/modules/books/infrastructure/repositories/books/prisma-book-read.repository.ts)
11. [`http-exception.filter.ts`](../../backend/src/shared/platform/filters/http-exception.filter.ts)

---

## Phần code tự chứa để đọc khi không có repository

Các trích đoạn dưới đây được rút gọn từ implementation hiện tại: bỏ import, Swagger mô tả dài và các field không trực tiếp cần để hiểu đường đi. Có thể đọc phần này độc lập; đường dẫn file ở các phần trên chỉ để đối chiếu khi có repository.

### A. Composition root: Nest đăng ký phần dùng chung và feature

```ts
// app.module.ts — lược gọn
@Module({
  imports: [
    CoreModule,
    BooksModule,
    AuthorsModule,
    GenresModule,
    ChromaModule,
    // các feature khác
  ],
})
export class AppModule {}
```

```ts
// books.module.ts — lược gọn
@Module({
  imports: [BooksApplicationModule, BooksReadingRoomsIntegrationModule],
  controllers: [BooksController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineBookAbilities, defineLikeAbilities]),
    },
    PoliciesGuard,
  ],
})
export class BooksModule {}
```

`BooksApplicationModule` đăng ký `CreateBookHandler` và `GetBookByIdHandler`. `BooksRepositoryModule` nối hợp đồng ghi `IBookRepository` với class Prisma `BookRepository`; các port đọc được nối với `PrismaBookReadRepository`. Nest dùng các đăng ký này để inject dependency, nên controller không tự tạo handler hoặc repository.

`CoreModule` cấu hình `ClsPluginTransactional` cùng `TransactionalAdapterPrisma`. `PrismaService` tạo Prisma Client bằng `PrismaPg` và `DATABASE_URL`. Application handler gọi `@Transactional()`; repository gọi client từ `TransactionHost`, vì vậy không cần chuyền transaction client qua từng method.

### B. HTTP entry point: route, guard, upload và DTO

```ts
// books.controller.ts — method tạo sách, lược gọn
@Controller('books')
@UseGuards(PoliciesGuard)
export class BooksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CheckPolicy('create', 'Book')
  @ApiFileUpload('coverUrl')
  async create(
    @Body() dto: CreateBookDto,
    @CurrentActor() actor: Actor,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookResponseDto> {
    const bookId = await this.commandBus.execute(dto.toCommand(actor, file));
    const book = await this.queryBus.execute(
      new GetBookByIdQuery(actor, bookId),
    );
    return BookResponseDto.fromReadModel(book);
  }
}
```

`main.ts` đặt global prefix `api`, URI version mặc định `1`, nên Nest định tuyến method này thành `/api/v1/books`. `@ApiFileUpload` gắn `FileInterceptor`, giới hạn 5 MB và chỉ nhận JPEG, PNG, WebP, AVIF. Global `ValidationPipe` bật `transform`, `whitelist`, `forbidNonWhitelisted`; vì đây là multipart, interceptor đọc file còn class-validator kiểm tra các field DTO.

SecurityModule đăng ký ba global guards theo thứ tự `JwtAuthGuard` → `UserThrottlerGuard` → `CsrfGuard`. Controller dùng `PoliciesGuard` để thực thi `@CheckPolicy`; guard dựng `Actor` từ user đã xác thực, rồi `@CurrentActor()` lấy actor đó cho controller. Quyền admin được khai báo trong ability tương ứng của từng feature; không còn `RolesGuard` hoặc `@RequireAuth` trong mã nguồn backend.

```ts
// create-book.dto.ts — các field quan trọng
export class CreateBookDto {
  @IsNotEmpty()
  @Length(5, 200)
  title!: string;

  @IsNotEmpty()
  @IsString()
  authorId!: string;

  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : [],
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  genres!: string[];

  toCommand(actor: Actor, coverFile?: MediaUploadFile): CreateBookCommand {
    return new CreateBookCommand({
      actor,
      title: this.title,
      authorId: this.authorId,
      authorName: this.authorName,
      genres: this.genres,
      description: this.description,
      publishedYear: this.publishedYear,
      coverUrl: this.coverUrl,
      coverFile,
      status: this.status,
      tags: this.tags,
    });
  }
}
```

DTO là biên HTTP: nó validate và chuyển dữ liệu sang command. DTO không ghi DB. `CreateBookCommand` là class dữ liệu thuần gồm `actor`, `title`, `authorId`, `authorName?`, `genres`, `description?`, `publishedYear?`, `coverUrl?`, `coverFile?`, `status?`, `tags?`; nó không chứa logic tạo sách.

### C. Application: handler, quyền và ranh giới transaction

```ts
// create-book.handler.ts — thứ tự thật, lược gọn
@CommandHandler(CreateBookCommand)
export class CreateBookHandler implements ICommandHandler<CreateBookCommand, string> {
  async execute(command: CreateBookCommand): Promise<string> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan('create', 'Book');
    if (command.genres.length === 0 || command.genres.length > 5) {
      throw new BadRequestDomainException('Invalid number of genres');
    }

    // Dịch vụ ngoài: hoàn tất trước khi mở transaction PostgreSQL.
    const coverUrl = command.coverFile
      ? await this.media.uploadImage(command.coverFile)
      : command.coverUrl;

    // Transaction bao quanh phần tìm/tạo dữ liệu và ghi DB.
    const book = await this.createBook(command, coverUrl);

    // Redis nằm ngoài transaction.
    await this.bookCache.setDetail(book);
    return book.id.toString();
  }

  @Transactional()
  private async createBook(command: CreateBookCommand, coverUrl?: string): Promise<Book> {
    const title = BookTitle.create(command.title);
    if (await this.bookRepository.existsByTitle(title)) {
      throw new ConflictDomainException('Book with this title already exists');
    }

    const authorId = await this.resolveAuthorId(command);
    const genreIds = await this.resolveGenreIds(command);
    const book = Book.create({
      id: BookId.create(this.idGenerator.generate()),
      title: command.title,
      authorId,
      genres: genreIds,
      description: command.description,
      publishedYear: command.publishedYear,
      coverUrl,
      status: command.status,
      tags: command.tags,
    });

    await this.bookRepository.save(book);
    await this.bookOutbox.append({
      id: randomUUID(),
      type: 'book.created',
      bookId: book.id.toString(),
    });
    return book;
  }
}
```

Các dependency bị lược khỏi constructor của ví dụ: `IBookRepository`, `CommandBus`, `QueryBus`, `IIdGenerator`, `IBookCachePort`, `BookOutboxPort`, `IMediaPort`. Chúng là các hợp đồng/hạ tầng mà handler cần; Nest cung cấp implementation lúc khởi động.

Trong `resolveAuthorId()` và `resolveGenreIds()`, handler gọi command/query công khai của Authors và Genres. Nếu người dùng nhập ID thì dùng ID; nếu gửi lựa chọn dạng `new:<tên>` thì handler tìm theo tên, có rồi thì tái sử dụng, chưa có thì dispatch command tạo mới. Handler Books không tự thao tác trực tiếp Prisma model Author/Genre.

### D. Domain: tạo entity và áp dụng quy tắc

```ts
// book.entity.ts — phần create, giản lược
static create(props: {
  id: BookId;
  title: string;
  authorId: string;
  genres: string[];
  description?: string;
  publishedYear?: string;
  coverUrl?: string;
  status?: 'draft' | 'published' | 'completed';
  tags?: string[];
}): Book {
  const title = BookTitle.create(props.title);
  const slug = Book.generateSlug(props.title);
  const authorId = AuthorId.create(props.authorId);
  const genres = props.genres.map((id) => GenreId.create(id));

  return new Book(props.id, {
    title,
    slug,
    authorId,
    genres,
    description: props.description?.trim() || '',
    publishedYear: props.publishedYear?.trim() || '',
    coverUrl: props.coverUrl?.trim() || '',
    status: props.status ? BookStatus.create(props.status) : BookStatus.draft(),
    tags: props.tags || [],
    views: 0,
    likes: 0,
    likedBy: [],
  });
}
```

Đây là lý do handler không tự ghép một object bất kỳ rồi gọi Prisma: `Book.create()` tạo một entity hợp lệ, dùng value object và khởi tạo trạng thái domain ban đầu. Domain không biết request đến từ HTTP hay dữ liệu sẽ được ghi bằng Prisma.

### E. Persistence: port, mapper và PostgreSQL

Port ghi `IBookRepository` định nghĩa thao tác với domain `Book`, ví dụ `save(book): Promise<void>`. Infrastructure triển khai port đó:

```ts
// book.repository.ts — nhánh ghi entity mới, rút gọn
constructor(private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>) {}

private get client(): Prisma.TransactionClient {
  return this.transactionHost.tx;
}

async save(book: Book): Promise<void> {
  const data = PrismaBookMapper.persistenceData(book);
  const { genres, likesByUser, ...fields } = data;

  if (book.isNew) {
    await this.client.book.create({ data: { ...fields, genres, likesByUser } });
    book.markPersisted(0);
    return;
  }

  // Với entity cũ, repository dùng version để phát hiện ghi đè đồng thời.
  // Phần update đầy đủ gồm update có điều kiện version và đồng bộ quan hệ.
}
```

`TransactionHost.tx` trả client thuộc transaction hiện tại. Trong luồng này, `createBook()` đã mở transaction, nên `save()` và `BookOutboxRepository.append()` cùng tham gia transaction đó.

Mapper là nơi chuyển domain sang Prisma input:

```ts
// prisma-book.mapper.ts — các field chính
static persistenceData(book: Book): Prisma.BookUncheckedCreateInput {
  return {
    id: book.id.toString(),
    authorId: book.authorId.toString(),
    title: book.title.toString(),
    slug: book.slug,
    publishedYear: book.publishedYear,
    description: book.description,
    coverUrl: book.coverUrl,
    status: book.status.toString(),
    tags: book.tags,
    views: book.views,
    likes: book.likes,
    version: book.loadedVersion,
    genres: { create: book.genres.map((genre) => ({ genreId: genre.toString() })) },
    likesByUser: { create: book.likedBy.map((userId) => ({ userId })) },
  };
}
```

Prisma gửi lệnh SQL tới PostgreSQL. Model `Book` dùng UUID làm `id`, có các cột nội dung, `version`, `isDeleted`, timestamps và quan hệ tới Author/Genre. Ở nhánh tạo mới, repository tạo hàng sách và các quan hệ; sau khi thành công, entity được đánh dấu `isNew = false` và `isDirty = false`.

### F. Outbox: DB ghi nhận việc cần làm, worker xử lý sau

```ts
// BookOutboxRepository.append()
await transactionHost.tx.bookOutbox.create({
  data: {
    eventId: event.id,
    type: event.type,
    bookId: event.bookId,
    status: 'pending',
  },
});
```

Điểm chính không phải là “gọi queue trong transaction”. Outbox chỉ ghi một hàng vào PostgreSQL trong cùng transaction với Book. Worker sẽ đọc hàng pending sau đó:

```ts
// BookOutboxRelayCron.processBatch(), ý chính
const events = await outbox.claimBatch(25);
for (const event of events) {
  await chromaQueue.add(
    'index-book',
    { bookId: event.bookId },
    {
      jobId: `book-outbox-${event.id}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    },
  );
  await outbox.markPublished(event.id);
}
```

Relay chạy cron mỗi 10 giây trong worker mode. Nếu enqueue lỗi, nó trả event về pending với thời gian chờ tăng dần. `ChromaProcessor` nhận job `index-book`, đọc sách và cập nhật vector index. Đây là eventual consistency: sách có thể đã tạo và trả response trước khi tìm kiếm vector nhìn thấy sách.

### G. Query và response: đọc model cho client

```ts
// get-book-by-id.handler.ts
async execute(query: GetBookByIdQuery): Promise<BookListReadModel> {
  if (!query.id) throw new BadRequestDomainException('Invalid ID');

  const book = await this.bookReadRepository.findListById(
    query.actor.ability,
    query.id,
  );
  if (!book) throw new NotFoundDomainException('Book not found');
  return book;
}
```

Read repository không dựng aggregate `Book`. Nó truy vấn projection cần cho màn hình, áp điều kiện quyền CASL cùng điều kiện bản ghi chưa xóa, rồi mapper thành read model:

```ts
// PrismaBookReadRepository.findListById(), phần query cốt lõi
const row = await transactionHost.tx.book.findFirst({
  where: {
    AND: [
      { id, isDeleted: false },
      accessibleBy(ability).ofType('Book'),
    ],
  },
  include: BOOK_WITH_RELATIONS,
});
return row ? PrismaBookMapper.toListReadModel(row) : null;
```

Controller nhận `BookListReadModel` và chuyển thành `BookResponseDto`. DTO đóng vai trò hợp đồng HTTP; ví dụ nó tạo field `authorId: { id, name }`, đưa số liệu vào `stats`, và giữ các field client cần. Nest trả DTO đó với HTTP `201 Created`.

```ts
// book.response.dto.ts — mapping cốt lõi
static fromReadModel(readModel: BookListReadModel): BookResponseDto {
  return new BookResponseDto(readModel);
}

constructor(readModel: BookListReadModel) {
  this.id = readModel.id;
  this.title = readModel.title;
  this.slug = readModel.slug;
  this.authorId = {
    id: readModel.authorId,
    name: readModel.authorName || '—',
  };
  this.genres = readModel.genres;
  this.stats = {
    views: readModel.stats.views,
    likes: readModel.stats.likes,
    chapterCount: readModel.stats.chapterCount,
    averageRating: 0,
    totalRatings: 0,
  };
  // Các field còn lại được map tường minh tương tự.
}
```

### H. Nhánh lỗi: từ exception sang Problem Details

`ValidationPipe`, guard, handler và Prisma có thể ném các exception khác loại. `HttpExceptionFilter` là điểm chuyển chúng thành body HTTP thống nhất. Dạng response hiện tại:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "code": "DUPLICATE_KEY",
  "detail": "A record with the same unique value already exists",
  "traceId": "request-trace-id"
}
```

Validation có thêm `errors: [{ field, code, message }]`. Filter gắn `x-request-id`; lỗi 429/503 có `Retry-After`. Với lỗi 5xx, client nhận thông điệp chung còn stack/chi tiết được log.

Trong code hiện tại, Filter nhận diện `DomainException`, `HttpException`, Prisma `P2002` và lỗi Multer. CASL `ForbiddenError` do handler ném không được liệt kê riêng trong filter; request HTTP tạo sách thường đã bị guard chặn trước, nhưng đường gọi command nội bộ cần được kiểm tra nếu sử dụng.

### I. Tóm lại: cái nào đồng bộ, cái nào không?

| Phần việc | Cơ chế hiện tại | Kết quả khi lỗi |
|---|---|---|
| Tạo Book + quan hệ + hàng outbox | Một transaction PostgreSQL | Cùng commit hoặc cùng rollback |
| Tạo author/genre khi cần | Dispatch command module khác trong transaction context | Theo transaction hiện hành của CLS/Prisma |
| Upload cover | Media service trước transaction | Có thể để lại ảnh mồ côi nếu DB rollback |
| Cập nhật cache | Redis sau commit | Cache lỗi không rollback được Book đã commit |
| Index vector | Outbox → BullMQ → Chroma worker | Có thể trễ; retry theo relay/queue |
| Tạo HTTP response | Query sau khi command đã commit | Query lỗi vẫn có thể khiến client nhận lỗi dù Book tồn tại |

Vì vậy câu “có transaction” chỉ nói về các lần ghi PostgreSQL được thực hiện trong transaction context. Nó không biến upload, Redis, queue, Chroma và response HTTP thành một thao tác nguyên tử duy nhất.
