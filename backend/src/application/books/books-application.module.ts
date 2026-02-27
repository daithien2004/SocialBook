import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { Module } from '@nestjs/common';
import { BookViewedHandler } from './event-handlers/book-viewed.handler';
import { CreateBookUseCase } from './use-cases/create-book/create-book.use-case';
import { DeleteBookUseCase } from './use-cases/delete-book/delete-book.use-case';
import { GetBookByIdUseCase } from './use-cases/get-book-by-id/get-book-by-id.use-case';
import { GetBookBySlugUseCase } from './use-cases/get-book-by-slug/get-book-by-slug.use-case';
import { GetBooksUseCase } from './use-cases/get-books/get-books.use-case';
import { UpdateBookUseCase } from './use-cases/update-book/update-book.use-case';

@Module({
  imports: [
    BooksRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    CreateBookUseCase,
    DeleteBookUseCase,
    GetBookByIdUseCase,
    GetBookBySlugUseCase,
    GetBooksUseCase,
    UpdateBookUseCase,
    BookViewedHandler,
  ],
  exports: [
    CreateBookUseCase,
    DeleteBookUseCase,
    GetBookByIdUseCase,
    GetBookBySlugUseCase,
    GetBooksUseCase,
    UpdateBookUseCase,
  ],
})
export class BooksApplicationModule { }
