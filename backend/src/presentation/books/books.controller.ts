import { Public, ApiFileUpload } from '@/common/decorators/customize';
import { RequireAuth } from '@/common/decorators/auth-swagger.decorator';
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
  Req,
  UploadedFile,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

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
import { GetBookBySlugQuery } from '@/application/books/use-cases/get-book-by-slug/get-book-by-slug.query'; // Import Query
import { GetBookBySlugUseCase } from '@/application/books/use-cases/get-book-by-slug/get-book-by-slug.use-case';
import { GetBooksQuery } from '@/application/books/use-cases/get-books/get-books.query';
import { GetBooksUseCase } from '@/application/books/use-cases/get-books/get-books.use-case';
import { UpdateBookCommand } from '@/application/books/use-cases/update-book/update-book.command';
import { UpdateBookUseCase } from '@/application/books/use-cases/update-book/update-book.use-case';
import { GetLikeCountUseCase } from '@/application/likes/use-cases/get-like-count/get-like-count.use-case';
import { ToggleLikeUseCase } from '@/application/likes/use-cases/toggle-like/toggle-like.use-case';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';

@ApiTags('Books')
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
    private readonly toggleLikeUseCase: ToggleLikeUseCase,
    private readonly getLikeCountUseCase: GetLikeCountUseCase,
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
  async toggleLike(
    @Param('slug') slug: string,
    @Req() req: Request & { user: { id: string } }
  ) {
    const book = await this.getBookBySlugUseCase.execute(new GetBookBySlugQuery(slug));

    const result = await this.toggleLikeUseCase.execute({
      userId: req.user.id,
      targetId: book.id,
      targetType: TargetType.BOOK,
    });

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
