import { Controller, Get, Param } from '@nestjs/common';
import { BooksService } from './books.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) { }

  @Public()
  @Get(':slug')
  async getBookDetail(@Param('slug') slug: string) {
    return await this.booksService.findBySlug(slug);
  }
}
