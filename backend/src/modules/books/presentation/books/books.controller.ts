import {
  buildPaginationMeta,
  PaginatedResult,
} from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { SkipThrottle } from '@nestjs/throttler';
import {
  UseImageUpload,
  Public,
} from '@/shared/platform/decorators/custom.decorator';
import {
  HttpCode,
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
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { BookDetailResponseDto } from '@/modules/books/presentation/books/dto/book-detail.response.dto';
import { BookResponseDto } from '@/modules/books/presentation/books/dto/book.response.dto';
import { BookFiltersResponseDto } from '@/modules/books/presentation/books/dto/book-filters.response.dto';
import { BookLikeResponseDto } from '@/modules/books/presentation/books/dto/book-like.response.dto';
import { CreateBookDto } from '@/modules/books/presentation/books/dto/create-book.dto';
import { FilterBookDto } from '@/modules/books/presentation/books/dto/filter-book.dto';
import { UpdateBookDto } from '@/modules/books/presentation/books/dto/update-book.dto';

import { DeleteBookCommand } from '@/modules/books/application/books/commands/delete-book/delete-book.command';
import { GetBookByIdQuery } from '@/modules/books/application/books/queries/get-book-by-id/get-book-by-id.query';
import { GetBookBySlugQuery } from '@/modules/books/application/books/queries/get-book-by-slug/get-book-by-slug.query';
import { GetBookFiltersQuery } from '@/modules/books/application/books/queries/get-book-filters/get-book-filters.query';
import { GetBooksQuery } from '@/modules/books/application/books/queries/get-books/get-books.query';
import { IntelligentSearchQuery } from '@/modules/search';
import { ToggleBookLikeCommand } from '@/modules/books/application/books/commands/toggle-book-like/toggle-book-like.command';
import { RecordBookViewCommand } from '@/modules/books/application/books/commands/record-book-view/record-book-view.command';
import { GetTopReadBooksQuery } from '@/modules/books/application/books/queries/get-top-read-books/get-top-read-books.query';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import {
  ApiBooksController,
  ApiCreateBook,
  ApiDeleteBook,
  ApiGetBookById,
  ApiGetBookBySlug,
  ApiGetBookFilters,
  ApiListAdminBooks,
  ApiListBooks,
  ApiListTopReadBooks,
  ApiRecordBookView,
  ApiToggleBookLike,
  ApiUpdateBook,
} from './books.swagger';

@ApiBooksController()
@Controller('books')
@SkipThrottle({ global: true })
@UseGuards(PoliciesGuard)
export class BooksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiCreateBook()
  @Post()
  @CheckPolicy('create', 'Book')
  @SkipThrottle({ global: false })
  @UseImageUpload('coverUrl')
  async create(
    @Body() createBookDto: CreateBookDto,
    @CurrentActor() actor: Actor,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookResponseDto> {
    const bookId = await this.commandBus.execute(
      createBookDto.toCommand(actor, file),
    );
    const book = await this.queryBus.execute(
      new GetBookByIdQuery(actor, bookId),
    );
    return BookResponseDto.fromReadModel(book);
  }

  @ApiListAdminBooks()
  @Get('admin/all')
  @CheckPolicy('read', 'Book')
  @SkipThrottle({ global: false })
  async findAllAdmin(
    @Query() filter: FilterBookDto,
    @CurrentActor() actor: Actor,
  ): Promise<PaginatedResult<BookResponseDto>> {
    const query = new GetBooksQuery({
      actor,
      ...filter,
      sortBy: filter.sortBy,
    });

    const result = await this.queryBus.execute(query);

    return { data: BookResponseDto.fromArray(result.data), meta: result.meta };
  }

  @ApiGetBookFilters()
  @Public()
  @Get('filters/all')
  @CheckPolicy('read', 'Book')
  async getFilters(
    @CurrentActor() actor: Actor,
  ): Promise<BookFiltersResponseDto> {
    const query = new GetBookFiltersQuery(actor);
    const data = await this.queryBus.execute(query);

    return BookFiltersResponseDto.fromReadModel(data);
  }

  @ApiListTopReadBooks()
  @Public()
  @CheckPolicy('read', 'Book')
  @Get('top-read')
  async getTopReadBooks(
    @CurrentActor() actor: Actor,
    @Query('timeRange') timeRange: 'weekly' | 'monthly' | 'all' = 'all',
    @Query('limit') limit: number = 5,
  ): Promise<PaginatedResult<BookResponseDto>> {
    const query = new GetTopReadBooksQuery(actor, timeRange, Number(limit));
    const result = await this.queryBus.execute(query);

    const data = BookResponseDto.fromArray(result);
    return {
      data: data,
      meta: buildPaginationMeta(1, Math.max(data.length, 1), data.length),
    };
  }

  @ApiListBooks()
  @Public()
  @CheckPolicy('read', 'Book')
  @Get()
  async findAll(
    @Query() filter: FilterBookDto,
    @CurrentActor() actor: Actor,
  ): Promise<PaginatedResult<BookResponseDto>> {
    // Nếu có từ khóa tìm kiếm, sử dụng Intelligent Search
    if (filter.search) {
      const query = new IntelligentSearchQuery({
        actor,
        query: filter.search,
        mode: filter.mode,
        ...filter,
      });

      const result = await this.queryBus.execute(query);

      return {
        data: BookResponseDto.fromSearchResults(result.data),
        meta: result.meta,
      };
    }

    // Nếu không search, dùng logic GetBooks bình thường (Danh sách trang chủ)
    const query = new GetBooksQuery({
      actor,
      ...filter,
      search: undefined, // Explicitly clear search for fallback flow
    });

    const result = await this.queryBus.execute(query);

    return { data: BookResponseDto.fromArray(result.data), meta: result.meta };
  }

  @ApiGetBookBySlug()
  @Get(':slug')
  @Public()
  @CheckPolicy('read', 'Book')
  async findOne(
    @Param('slug') slug: string,
    @CurrentActor() actor: Actor,
  ): Promise<BookDetailResponseDto> {
    const query = new GetBookBySlugQuery(actor, slug);
    const book = await this.queryBus.execute(query);

    return BookDetailResponseDto.fromReadModel(book);
  }

  @ApiToggleBookLike()
  @Patch(':slug/like')
  @CheckPolicy('like', 'Book')
  @SkipThrottle({ global: false })
  async toggleLike(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
    @CurrentActor() actor: Actor,
  ): Promise<BookLikeResponseDto> {
    const book = await this.queryBus.execute(
      new GetBookBySlugQuery(actor, slug),
    );
    const command = new ToggleBookLikeCommand({
      actor,
      bookId: book.id,
      userId,
      bookSlug: slug,
    });
    const result = await this.commandBus.execute(command);

    return new BookLikeResponseDto({
      slug: book.slug,
      isLiked: result.isLiked,
      likes: result.likes,
    });
  }

  @ApiRecordBookView()
  @Post(':slug/views')
  @Public()
  @CheckPolicy('read', 'Book')
  @HttpCode(204)
  async recordView(
    @Param('slug') slug: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    await this.commandBus.execute(new RecordBookViewCommand(actor, slug));
    return undefined;
  }

  @ApiGetBookById()
  @Get('id/:id')
  @Public()
  @CheckPolicy('read', 'Book')
  async findOneById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<BookResponseDto> {
    const query = new GetBookByIdQuery(actor, id);
    const book = await this.queryBus.execute(query);

    return BookResponseDto.fromReadModel(book);
  }

  @ApiUpdateBook()
  @Put(':id')
  @CheckPolicy('update', 'Book')
  @SkipThrottle({ global: false })
  @UseImageUpload('coverUrl')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateBookDto: UpdateBookDto,
    @CurrentActor() actor: Actor,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookResponseDto> {
    // Xử lý upload file nếu có
    const bookId = await this.commandBus.execute(
      updateBookDto.toCommand(actor, id, file),
    );
    const book = await this.queryBus.execute(
      new GetBookByIdQuery(actor, bookId),
    );
    return BookResponseDto.fromReadModel(book);
  }

  @ApiDeleteBook()
  @HttpCode(204)
  @Delete(':id')
  @CheckPolicy('delete', 'Book')
  @SkipThrottle({ global: false })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    const command = new DeleteBookCommand(actor, id);
    await this.commandBus.execute(command);
    return undefined;
  }
}
