import { CommandBus, QueryBus } from '@nestjs/cqrs';

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

import { BookDetailResponseDto } from '@/modules/books/presentation/books/dto/book-detail.response.dto';
import { BookResponseDto } from '@/modules/books/presentation/books/dto/book.response.dto';
import { CreateBookDto } from '@/modules/books/presentation/books/dto/create-book.dto';
import { FilterBookDto } from '@/modules/books/presentation/books/dto/filter-book.dto';
import { UpdateBookDto } from '@/modules/books/presentation/books/dto/update-book.dto';

import { CreateBookCommand } from '@/modules/books/application/books/commands/create-book/create-book.command';
import { DeleteBookCommand } from '@/modules/books/application/books/commands/delete-book/delete-book.command';
import { GetBookByIdQuery } from '@/modules/books/application/books/queries/get-book-by-id/get-book-by-id.query';
import { GetBookBySlugQuery } from '@/modules/books/application/books/queries/get-book-by-slug/get-book-by-slug.query';
import { GetBookFiltersQuery } from '@/modules/books/application/books/queries/get-book-filters/get-book-filters.query';
import { GetBooksQuery } from '@/modules/books/application/books/queries/get-books/get-books.query';
import { UpdateBookCommand } from '@/modules/books/application/books/commands/update-book/update-book.command';
import {
  IntelligentSearchHandler,
  IntelligentSearchQuery,
} from '@/modules/search';
import { ToggleBookLikeCommand } from '@/modules/books/application/books/commands/toggle-book-like/toggle-book-like.command';
import { RecordBookViewCommand } from '@/modules/books/application/books/commands/record-book-view/record-book-view.command';
import { GetTopReadBooksQuery } from '@/modules/books/application/books/queries/get-top-read-books/get-top-read-books.query';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('books')
@SkipThrottle({ global: true })
export class BooksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,

    private readonly mediaService: IMediaPort,
    private readonly intelligentSearchUseCase: IntelligentSearchHandler,
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

    const book = await this.commandBus.execute(command);
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

    const result = await this.queryBus.execute(query);

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
    const data = await this.queryBus.execute(query);

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
    const result = await this.queryBus.execute(query);

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

    const result = await this.queryBus.execute(query);

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
    const book = await this.queryBus.execute(query);

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
    const book = await this.queryBus.execute(new GetBookBySlugQuery(slug));
    const command = new ToggleBookLikeCommand({
      bookId: book.id,
      userId,
      bookSlug: slug,
    });
    const result = await this.commandBus.execute(command);

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
    await this.commandBus.execute(new RecordBookViewCommand(slug));
    return {
      message: 'Recorded view successfully',
    };
  }

  @Get('id/:id')
  @Public()
  async findOneById(@Param('id') id: string) {
    const query = new GetBookByIdQuery(id);
    const book = await this.queryBus.execute(query);

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

    const book = await this.commandBus.execute(command);
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
    await this.commandBus.execute(command);
    return {
      message: 'Xóa sách thành công',
    };
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    return await this.mediaService.uploadImage(file);
  }
}
