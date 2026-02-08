import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateBookDto } from '@/presentation/books/dto/create-book.dto';
import { UpdateBookDto } from '@/presentation/books/dto/update-book.dto';
import { FilterBookDto } from '@/presentation/books/dto/filter-book.dto';
import { BookResponseDto } from '@/presentation/books/dto/book.response.dto';

import { CreateBookUseCase } from '@/application/books/use-cases/create-book/create-book.use-case';
import { UpdateBookUseCase } from '@/application/books/use-cases/update-book/update-book.use-case';
import { GetBooksUseCase } from '@/application/books/use-cases/get-books/get-books.use-case';
import { GetBookByIdUseCase } from '@/application/books/use-cases/get-book-by-id/get-book-by-id.use-case';
import { GetBookBySlugUseCase } from '@/application/books/use-cases/get-book-by-slug/get-book-by-slug.use-case';
import { DeleteBookUseCase } from '@/application/books/use-cases/delete-book/delete-book.use-case';
import { Types } from 'mongoose';

import { CreateBookCommand } from '@/application/books/use-cases/create-book/create-book.command';
import { UpdateBookCommand } from '@/application/books/use-cases/update-book/update-book.command';
import { GetBooksQuery } from '@/application/books/use-cases/get-books/get-books.query';
import { DeleteBookCommand } from '@/application/books/use-cases/delete-book/delete-book.command';

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
  ) {}

  /**
   * POST /books - Create new book (admin only)
   */
  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('coverUrl'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateBookDto })
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
      data: new BookResponseDto(book),
    };
  }

  /**
   * GET /books - Get public books (browse & search)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get public books (browse & search)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'genres', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: String })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(
    @Query() filter: FilterBookDto,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    const query = new GetBooksQuery(
      Number(page),
      Number(limit),
      filter.title,
      filter.authorId,
      filter.genres,
      filter.tags,
      filter.status,
      filter.search,
      filter.publishedYear,
      sortBy as any,
      order as any
    );
    
    const result = await this.getBooksUseCase.execute(query);
    
    return {
      message: 'Lấy danh sách sách thành công',
      data: result.data.map(book => new BookResponseDto(book)),
      meta: result.meta,
    };
  }

  /**
   * GET /books/:slug - Get book by Slug
   */
  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get book by Slug' })
  @ApiParam({ name: 'slug', description: 'Book Slug' })
  async findOne(@Param('slug') slug: string) {
    const book = await this.getBookBySlugUseCase.execute(slug);

    return {
      message: 'Lấy thông tin sách thành công',
      data: new BookResponseDto(book),
    };
  }

  /**
   * PUT /books/:id - Update book (admin only)
   */
  @Put(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('coverUrl'))
  @ApiOperation({ summary: 'Update book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateBookDto })
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
      data: new BookResponseDto(book),
    };
  }

  /**
   * DELETE /books/:id - Delete book (admin only)
   */
  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
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
