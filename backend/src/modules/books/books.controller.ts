import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';
import { CreateBookDto } from './dto/create-book.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('/all')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllForAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: 'draft' | 'published' | 'completed',
    @Query('search') search?: string,
    @Query('genre') genre?: string,
    @Query('author') author?: string,
  ) {
    const data = await this.booksService.getAllBook({
      page: +page,
      limit: +limit,
      status,
      search,
      genre,
      author,
    });

    return {
      success: true,
      message: 'Lấy danh sách sách thành công',
      data,
    };
  }

  @Get('id/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getBookById(@Param('id') id: string) {
    const result = await this.booksService.findById(id);

    return {
      message: 'Get book by ID successfully',
      data: result,
    };
  }

  @Public()
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getBookDetail(@Request() req: any, @Param('slug') slug: string) {
    const userId = req.user?.id || null;
    const result = await this.booksService.findBySlug(slug, userId);

    return {
      message: 'Get book detail successfully',
      data: result,
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getBooks() {
    const result = await this.booksService.getBooks();

    return {
      message: 'Get books successfully',
      data: result,
    };
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('coverUrl'))
  @HttpCode(HttpStatus.CREATED)
  async createBook(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    console.log('📥 Received DTO:', createBookDto);
    console.log('📁 File:', coverFile?.originalname);

    const book = await this.booksService.createBook(createBookDto, coverFile);

    return {
      message: 'Thêm sách thành công',
      data: book,
    };
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('coverUrl'))
  @HttpCode(HttpStatus.OK)
  async updateBook(
    @Param('id') id: string,
    @Body() updateBookDto: CreateBookDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    console.log('📝 Updating book:', id);
    console.log('📥 Received DTO:', updateBookDto);
    console.log('📁 File:', coverFile?.originalname);

    const book = await this.booksService.updateBook(
      id,
      updateBookDto,
      coverFile,
    );

    return {
      message: 'Cập nhật sách thành công',
      data: book,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async deleteBook(@Param('id') id: string) {
    console.log('🗑️ Deleting book:', id);

    await this.booksService.deleteBook(id);

    return {
      message: 'Xóa sách thành công',
    };
  }

  @Patch(':bookSlug/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Param('bookSlug') bookSlug: string, @Request() req: any) {
    const result = await this.booksService.toggleLike(bookSlug, req.user.id);

    return {
      message: result.isLiked ? 'Liked book' : 'Unliked book',
      data: result,
    };
  }
}
