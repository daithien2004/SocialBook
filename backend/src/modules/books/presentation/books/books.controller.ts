import { ApiTags } from '@nestjs/swagger';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { SkipThrottle } from '@nestjs/throttler';
import { RequireAuth } from '@/shared/platform/decorators/auth-swagger.decorator';
import {
  ApiFileUpload,
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
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Books')
@Controller('books')
@SkipThrottle({ global: true })
@UseGuards(PoliciesGuard)
export class BooksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create a book' })
  @ApiProblemResponses([400, 401, 403, 409, 413, 422, 429, 500, 503])
  @ApiBearerAuth()
  @Post()
  @ApiCreatedResponse({ type: BookResponseDto })
  @RequireAuth('admin')
  @CheckPolicy('create', 'Book')
  @SkipThrottle({ global: false })
  @ApiFileUpload('coverUrl')
  async create(
    @Body() createBookDto: CreateBookDto,
    @CurrentActor() actor: Actor,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookResponseDto> {
    // Xá»­ lÃ½ upload file trÆ°á»›c khi táº¡o command
    const bookId = await this.commandBus.execute(
      createBookDto.toCommand(actor, file),
    );
    const book = await this.queryBus.execute(
      new GetBookByIdQuery(actor, bookId),
    );
    return BookResponseDto.fromReadModel(book);
  }

  @ApiOperation({ summary: 'List books for administration' })
  @ApiProblemResponses([400, 401, 403, 429, 500])
  @ApiBearerAuth()
  @ApiPaginatedResponse(BookResponseDto, 'offset')
  @Get('admin/all')
  @RequireAuth('admin')
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

  @ApiOperation({ summary: 'Get book filter options' })
  @ApiProblemResponses([429, 500])
  @Public()
  @Get('filters/all')
  @CheckPolicy('read', 'Book')
  @ApiOkResponse({ type: BookFiltersResponseDto })
  async getFilters(
    @CurrentActor() actor: Actor,
  ): Promise<BookFiltersResponseDto> {
    const query = new GetBookFiltersQuery(actor);
    const data = await this.queryBus.execute(query);

    return BookFiltersResponseDto.fromReadModel(data);
  }

  @ApiOperation({ summary: 'List the most-read books' })
  @ApiProblemResponses([400, 429, 500])
  @Public()
  @CheckPolicy('read', 'Book')
  @ApiPaginatedResponse(BookResponseDto, 'offset')
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

  @ApiOperation({ summary: 'List books' })
  @ApiProblemResponses([400, 429, 500])
  @Public()
  @CheckPolicy('read', 'Book')
  @ApiPaginatedResponse(BookResponseDto, 'offset')
  @Get()
  async findAll(
    @Query() filter: FilterBookDto,
    @CurrentActor() actor: Actor,
  ): Promise<PaginatedResult<BookResponseDto>> {
    // Náº¿u cÃ³ tá»« khÃ³a tÃ¬m kiáº¿m, sá»­ dá»¥ng Intelligent Search
    if (filter.search) {
      const query = new IntelligentSearchQuery({
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

    // Náº¿u khÃ´ng search, dÃ¹ng logic GetBooks bÃ¬nh thÆ°á»ng (Danh sÃ¡ch trang chá»§)
    const query = new GetBooksQuery({
      actor,
      ...filter,
      search: undefined, // Explicitly clear search for fallback flow
    });

    const result = await this.queryBus.execute(query);

    return { data: BookResponseDto.fromArray(result.data), meta: result.meta };
  }

  @ApiOperation({ summary: 'Get a book by slug' })
  @ApiProblemResponses([400, 404, 429, 500])
  @Get(':slug')
  @Public()
  @CheckPolicy('read', 'Book')
  @ApiOkResponse({ type: BookDetailResponseDto })
  async findOne(
    @Param('slug') slug: string,
    @CurrentActor() actor: Actor,
  ): Promise<BookDetailResponseDto> {
    const query = new GetBookBySlugQuery(actor, slug);
    const book = await this.queryBus.execute(query);

    return BookDetailResponseDto.fromReadModel(book);
  }

  @ApiOperation({ summary: 'Toggle the current user’s like on a book' })
  @ApiProblemResponses([401, 403, 404, 409, 429, 500])
  @ApiBearerAuth()
  @Patch(':slug/like')
  @CheckPolicy('like', 'Book')
  @ApiOkResponse({ type: BookLikeResponseDto })
  @RequireAuth()
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

  @ApiOperation({ summary: 'Record a book view' })
  @ApiProblemResponses([404, 429, 500])
  @Post(':slug/views')
  @Public()
  @CheckPolicy('read', 'Book')
  @HttpCode(204)
  @ApiNoContentResponse()
  async recordView(
    @Param('slug') slug: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    await this.commandBus.execute(new RecordBookViewCommand(actor, slug));
    return undefined;
  }

  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiProblemResponses([400, 404, 429, 500])
  @Get('id/:id')
  @Public()
  @CheckPolicy('read', 'Book')
  @ApiOkResponse({ type: BookResponseDto })
  async findOneById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<BookResponseDto> {
    const query = new GetBookByIdQuery(actor, id);
    const book = await this.queryBus.execute(query);

    return BookResponseDto.fromReadModel(book);
  }

  @ApiOperation({ summary: 'Update a book' })
  @ApiProblemResponses([400, 401, 403, 404, 409, 413, 422, 429, 500, 503])
  @ApiBearerAuth()
  @Put(':id')
  @CheckPolicy('update', 'Book')
  @ApiOkResponse({ type: BookResponseDto })
  @RequireAuth('admin')
  @SkipThrottle({ global: false })
  @ApiFileUpload('coverUrl')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateBookDto: UpdateBookDto,
    @CurrentActor() actor: Actor,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookResponseDto> {
    // Xá»­ lÃ½ upload file náº¿u cÃ³
    const bookId = await this.commandBus.execute(
      updateBookDto.toCommand(actor, id, file),
    );
    const book = await this.queryBus.execute(
      new GetBookByIdQuery(actor, bookId),
    );
    return BookResponseDto.fromReadModel(book);
  }

  @ApiOperation({ summary: 'Delete a book' })
  @ApiProblemResponses([400, 401, 403, 404, 409, 429, 500])
  @ApiBearerAuth()
  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  @RequireAuth('admin')
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
