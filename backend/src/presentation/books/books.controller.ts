import { SkipThrottle } from '@nestjs/throttler';
import { RequireAuth } from '@/common/decorators/auth-swagger.decorator';
import { ApiFileUpload, Public } from '@/common/decorators/custom.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
} from '@nestjs/common';

import { BookDetailResponseDto } from '@/presentation/books/dto/book-detail.response.dto';
import { BookResponseDto } from '@/presentation/books/dto/book.response.dto';
import { CreateBookDto } from '@/presentation/books/dto/create-book.dto';
import { FilterBookDto } from '@/presentation/books/dto/filter-book.dto';
import { UpdateBookDto } from '@/presentation/books/dto/update-book.dto';

import { CreateBookCommand } from '@/application/books/use-cases/create-book/create-book.command';
import { CreateBookUseCase } from '@/application/books/use-cases/create-book/create-book.use-case';
import { DeleteBookCommand } from '@/application/books/use-cases/delete-book/delete-book.command';
import { DeleteBookUseCase } from '@/application/books/use-cases/delete-book/delete-book.use-case';
import { GetBookByIdQuery } from '@/application/books/use-cases/get-book-by-id/get-book-by-id.query';
import { GetBookByIdUseCase } from '@/application/books/use-cases/get-book-by-id/get-book-by-id.use-case';
import { GetBookBySlugQuery } from '@/application/books/use-cases/get-book-by-slug/get-book-by-slug.query';
import { GetBookBySlugUseCase } from '@/application/books/use-cases/get-book-by-slug/get-book-by-slug.use-case';
import { GetBookFiltersQuery } from '@/application/books/use-cases/get-book-filters/get-book-filters.query';
import { GetBookFiltersUseCase } from '@/application/books/use-cases/get-book-filters/get-book-filters.use-case';
import { GetBooksQuery } from '@/application/books/use-cases/get-books/get-books.query';
import { GetBooksUseCase } from '@/application/books/use-cases/get-books/get-books.use-case';
import { UpdateBookCommand } from '@/application/books/use-cases/update-book/update-book.command';
import { UpdateBookUseCase } from '@/application/books/use-cases/update-book/update-book.use-case';
import { IntelligentSearchUseCase } from '@/application/search/use-cases/intelligent-search.use-case';
import { IntelligentSearchQuery } from '@/application/search/use-cases/intelligent-search.query';
import { ToggleBookLikeUseCase } from '@/application/books/use-cases/toggle-book-like/toggle-book-like.use-case';
import { RecordBookViewUseCase } from '@/application/books/use-cases/record-book-view/record-book-view.use-case';
import { RecordBookViewCommand } from '@/application/books/use-cases/record-book-view/record-book-view.command';
import { ToggleBookLikeCommand } from '@/application/books/use-cases/toggle-book-like/toggle-book-like.command';
import { GetTopReadBooksUseCase } from '@/application/books/use-cases/get-top-read-books/get-top-read-books.use-case';
import { GetTopReadBooksQuery } from '@/application/books/use-cases/get-top-read-books/get-top-read-books.query';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('books')
@SkipThrottle({ global: true })
export class BooksController {
  constructor(
    private readonly createBookUseCase: CreateBookUseCase,
    private readonly updateBookUseCase: UpdateBookUseCase,
    private readonly getBooksUseCase: GetBooksUseCase,
    private readonly getBookBySlugUseCase: GetBookBySlugUseCase,
    private readonly deleteBookUseCase: DeleteBookUseCase,
    private readonly mediaService: IMediaService,
    private readonly getBookByIdUseCase: GetBookByIdUseCase,
    private readonly getBookFiltersUseCase: GetBookFiltersUseCase,
    private readonly toggleBookLikeUseCase: ToggleBookLikeUseCase,
    private readonly intelligentSearchUseCase: IntelligentSearchUseCase,
    private readonly recordBookViewUseCase: RecordBookViewUseCase,
    private readonly getTopReadBooksUseCase: GetTopReadBooksUseCase,
  ) {}

  @Post()
  @RequireAuth('admin')
  @SkipThrottle({ global: false })
  @ApiFileUpload('coverUrl')
  async create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Xử lý upload file trước khi tạo command
    const coverUrl = file
      ? await this.uploadFile(file)
      : createBookDto.coverUrl;

    const command = new CreateBookCommand({
      ...createBookDto,
      coverUrl,
    });

    const book = await this.createBookUseCase.execute(command);
    return {
      message: 'Tạo sách thành công',
      data: BookResponseDto.fromEntity(book),
    };
  }

  @Get('admin/all')
  @RequireAuth('admin')
  @SkipThrottle({ global: false })
  async findAllAdmin(@Query() filter: FilterBookDto) {
    const query = new GetBooksQuery({
      ...filter,
      sortBy: filter.sortBy,
    });

    const result = await this.getBooksUseCase.execute(query);

    return {
      message: 'Lấy danh sách sách (Admin) thành công',
      data: BookResponseDto.fromArray(result.data),
      meta: result.meta,
    };
  }

  @Public()
  @Get('filters/all')
  async getFilters() {
    const query = new GetBookFiltersQuery();
    const data = await this.getBookFiltersUseCase.execute(query);

    return {
      message: 'Lấy danh sách bộ lọc thành công',
      data,
    };
  }

  @Public()
  @Get('top-read')
  async getTopReadBooks(
    @Query('timeRange') timeRange: 'weekly' | 'monthly' | 'all' = 'all',
    @Query('limit') limit: number = 5,
  ) {
    const query = new GetTopReadBooksQuery(timeRange, Number(limit));
    const result = await this.getTopReadBooksUseCase.execute(query);

    return {
      message: 'Lấy danh sách top đọc nhiều thành công',
      data: BookResponseDto.fromArray(result),
    };
  }

  @Public()
  @Get()
  async findAll(@Query() filter: FilterBookDto) {
    // Nếu có từ khóa tìm kiếm, sử dụng Intelligent Search
    if (filter.search) {
      const query = new IntelligentSearchQuery({
        query: filter.search,
        mode: filter.mode,
        ...filter,
      });

      const result = await this.intelligentSearchUseCase.execute(query);

      return {
        message: 'Tìm kiếm sách thành công',
        data: BookResponseDto.fromSearchResults(result.data),
        meta: result.meta,
      };
    }

    // Nếu không search, dùng logic GetBooks bình thường (Danh sách trang chủ)
    const query = new GetBooksQuery({
      ...filter,
      search: undefined, // Explicitly clear search for fallback flow
    });

    const result = await this.getBooksUseCase.execute(query);

    return {
      message: 'Lấy danh sách sách thành công',
      data: BookResponseDto.fromArray(result.data),
      meta: result.meta,
    };
  }

  @Get(':slug')
  @Public()
  async findOne(@Param('slug') slug: string) {
    const query = new GetBookBySlugQuery(slug);
    const book = await this.getBookBySlugUseCase.execute(query);

    return {
      message: 'Lấy thông tin sách thành công',
      data: BookDetailResponseDto.fromReadModel(book),
    };
  }

  @Patch(':slug/like')
  @RequireAuth()
  @SkipThrottle({ global: false })
  async toggleLike(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    const book = await this.getBookBySlugUseCase.execute(
      new GetBookBySlugQuery(slug),
    );
    const command = new ToggleBookLikeCommand({
      bookId: book.id,
      userId,
      bookSlug: slug,
    });
    const result = await this.toggleBookLikeUseCase.execute(command);

    return {
      message: result.isLiked ? 'Liked successfully' : 'Unliked successfully',
      data: {
        slug: book.slug,
        isLiked: result.isLiked,
        likes: result.likes,
      },
    };
  }

  @Post(':slug/views')
  @Public()
  async recordView(@Param('slug') slug: string) {
    await this.recordBookViewUseCase.execute(new RecordBookViewCommand(slug));
    return {
      message: 'Recorded view successfully',
    };
  }

  @Get('id/:id')
  @Public()
  async findOneById(@Param('id') id: string) {
    const query = new GetBookByIdQuery(id);
    const book = await this.getBookByIdUseCase.execute(query);

    return {
      message: 'Lấy thông tin sách thành công',
      data: BookResponseDto.fromEntity(book),
    };
  }

  @Put(':id')
  @RequireAuth('admin')
  @SkipThrottle({ global: false })
  @ApiFileUpload('coverUrl')
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Xử lý upload file nếu có
    const coverUrl = file
      ? await this.uploadFile(file)
      : updateBookDto.coverUrl;

    const command = new UpdateBookCommand({
      id,
      ...updateBookDto,
      coverUrl,
    });

    const book = await this.updateBookUseCase.execute(command);
    return {
      message: 'Cập nhật sách thành công',
      data: BookResponseDto.fromEntity(book),
    };
  }

  @Delete(':id')
  @RequireAuth('admin')
  @SkipThrottle({ global: false })
  async remove(@Param('id') id: string) {
    const command = new DeleteBookCommand(id);
    await this.deleteBookUseCase.execute(command);
    return {
      message: 'Xóa sách thành công',
    };
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    return await this.mediaService.uploadImage(file);
  }
}
