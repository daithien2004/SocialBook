import { Module } from '@nestjs/common';
import { BooksApplicationModule } from './application/books/books-application.module';
import { BooksController } from './presentation/books/books.controller';

@Module({
  imports: [BooksApplicationModule],
  controllers: [BooksController],
})
export class BooksModule {}
