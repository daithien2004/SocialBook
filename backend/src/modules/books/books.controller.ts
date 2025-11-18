import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { BooksService } from './books.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Public()
  @Get(':slug')
  async getBookDetail(@Param('slug') slug: string) {
    const result = await this.booksService.findBySlug(slug);

    return {
      message: 'Get books successfully',
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

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getBookById(@Param('id') id: string) {
    const result = await this.booksService.getBookById(id);

    return {
      message: 'Get book successfully',
      data: result,
    };
  }
}
