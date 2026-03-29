import { RequireAuth } from '@/common/decorators/auth-swagger.decorator';
import { ApiFileUpload, Public } from '@/common/decorators/customize';
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
  UseGuards,
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
import { GetFiltersUseCase } from '@/application/books/use-cases/get-filters/get-filters.use-case';
import { UpdateBookCommand } from '@/application/books/use-cases/update-book/update-book.command';
import { UpdateBookUseCase } from '@/application/books/use-cases/update-book/update-book.use-case';
import { GetLikeCountUseCase } from '@/application/likes/use-cases/get-like-count/get-like-count.use-case';
import { ToggleLikeUseCase } from '@/application/likes/use-cases/toggle-like/toggle-like.use-case';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('books')
export class BooksController {
  constructor(
    private readonly createBookUseCase: CreateBookUseCase,
    private readonly updateBookUseCase: UpdateBookUseCase,
    private readonly getBooksUseCase: GetBooksUseCase,
    private readonly getBookBySlugUseCase: GetBookBySlugUseCase,
    private readonly deleteBookUseCase: DeleteBookUseCase,
    private readonly mediaService: IMediaService,
    private readonly getBookByIdUseCase: GetBookByIdUseCase,
    private readonly getFiltersUseCase: GetFiltersUseCase,
    private readonly getBookFiltersUseCase: GetBookFiltersUseCase,
    private readonly toggleLikeUseCase: ToggleLikeUseCase,
    private readonly getLikeCountUseCase: GetLikeCountUseCase,
    private readonly bookRepository: IBookRepository,
  ) { }

  @Post()
  @RequireAuth('admin')
  @ApiFileUpload('coverUrl', CreateBookDto)
  async create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const command = new CreateBookCommand(
      createBookDto.title,
      createBookDto.authorId,
      createBookDto.genres,
      createBookDto.description,
      createBookDto.publishedYear,
      file ? await this.uploadFile(file) : createBookDto.coverUrl,
      createBookDto.status,
      createBookDto.tags
    );

    const book = await this.createBookUseCase.execute(command);
    return {
      message: 'Tạo sách thành công',
      data: BookResponseDto.fromEntity(book),
    };
  }

  @Get('admin/all')
  @RequireAuth('admin')
  async findAllAdmin(
    @Query() filter: FilterBookDto,
  ) {
    const query = new GetBooksQuery(
      filter.page,
      filter.limit,
      filter.title,
      filter.authorId,
      filter.genres,
      filter.tags,
      filter.status,
      filter.search,
      filter.publishedYear,
      filter.sortBy as any,
      filter.order as any
    );

    const result = await this.getBooksUseCase.execute(query);

    return {
      message: 'Lấy danh sách sách (Admin) thành công',
      data: result.data.map(readModel => BookResponseDto.fromReadModel(readModel)),
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
  @Get()
  async findAll(
    @Query() filter: FilterBookDto,
  ) {
    const query = new GetBooksQuery(
      filter.page,
      filter.limit,
      filter.title,
      filter.authorId,
      filter.genres,
      filter.tags,
      filter.status,
      filter.search,
      filter.publishedYear,
      filter.sortBy as any,
      filter.order as any
    );

    const result = await this.getBooksUseCase.execute(query);

    return {
      message: 'Lấy danh sách sách thành công',
      data: result.data.map(readModel => BookResponseDto.fromReadModel(readModel)),
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
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string
  ) {
    const book = await this.getBookBySlugUseCase.execute(new GetBookBySlugQuery(slug));
    const bookId = BookId.create(book.id);

    const result = await this.toggleLikeUseCase.execute({
      userId,
      targetId: book.id,
      targetType: TargetType.BOOK,
    });

    if (result.isLiked) {
      await this.bookRepository.addLike(bookId, userId);
    } else {
      await this.bookRepository.removeLike(bookId, userId);
    }

    const likesCount = await this.getLikeCountUseCase.execute({
      targetId: book.id,
      targetType: TargetType.BOOK,
    });

    return {
      message: result.isLiked ? 'Liked successfully' : 'Unliked successfully',
      data: {
        slug: book.slug,
        isLiked: result.isLiked,
        likes: likesCount.count,
      },
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
  @ApiFileUpload('coverUrl', UpdateBookDto)
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const command = new UpdateBookCommand(
      id,
      updateBookDto.title,
      updateBookDto.authorId,
      updateBookDto.genres,
      updateBookDto.description,
      updateBookDto.publishedYear,
      file ? await this.uploadFile(file) : updateBookDto.coverUrl,
      updateBookDto.status,
      updateBookDto.tags
    );

    const book = await this.updateBookUseCase.execute(command);
    return {
      message: 'Cập nhật sách thành công',
      data: BookResponseDto.fromEntity(book),
    };
  }

  @Delete(':id')
  @RequireAuth('admin')
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
