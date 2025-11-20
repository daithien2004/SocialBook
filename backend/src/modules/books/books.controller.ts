import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
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
  constructor(private readonly booksService: BooksService) { }

  @Public()
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getBookDetail(@Param('slug') slug: string) {
    const result = await this.booksService.findBySlug(slug);

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
  @UseInterceptors(FileInterceptor('coverUrl')) // ✅ Interceptor phải đứng TRƯỚC
  @HttpCode(HttpStatus.CREATED)
  async createBook(
    @Body() createBookDto: CreateBookDto, // ✅ XÓA ValidationPipe ở đây
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    console.log('📦 DTO:', createBookDto);
    console.log('🖼️ File:', coverFile);

    const book = await this.booksService.createBook(createBookDto, coverFile);

    return {
      message: 'Thêm sách thành công',
      data: book,
    };
  }
}
