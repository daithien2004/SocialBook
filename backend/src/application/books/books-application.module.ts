import { CqrsModule } from '@nestjs/cqrs';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { Module } from '@nestjs/common';
import { RecordBookViewHandler } from './use-cases/record-book-view/record-book-view.handler';
import { CreateBookHandler } from './use-cases/create-book/create-book.handler';
import { DeleteBookHandler } from './use-cases/delete-book/delete-book.handler';
import { GetBookByIdHandler } from './use-cases/get-book-by-id/get-book-by-id.handler';
import { GetBookBySlugHandler } from './use-cases/get-book-by-slug/get-book-by-slug.handler';
import { GetBooksHandler } from './use-cases/get-books/get-books.handler';
import { GetFiltersHandler } from './use-cases/get-filters/get-filters.handler';
import { GetBookFiltersHandler } from './use-cases/get-book-filters/get-book-filters.handler';
import { GetTopReadBooksHandler } from './use-cases/get-top-read-books/get-top-read-books.handler';
import { UpdateBookHandler } from './use-cases/update-book/update-book.handler';
import { ToggleBookLikeHandler } from './use-cases/toggle-book-like/toggle-book-like.handler';
import { LikesApplicationModule } from '@/application/likes/likes-application.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';

@Module({
  imports: [
    BooksRepositoryModule,
    AuthorsRepositoryModule,
    GenresRepositoryModule,
    IdGeneratorModule,
    LikesApplicationModule,
    ReviewsRepositoryModule,
    CqrsModule,
  ],
  providers: [
    CreateBookHandler,
    DeleteBookHandler,
    GetBookByIdHandler,
    GetBookBySlugHandler,
    GetBooksHandler,
    GetFiltersHandler,
    GetBookFiltersHandler,
    GetTopReadBooksHandler,
    UpdateBookHandler,
    ToggleBookLikeHandler,
    RecordBookViewHandler,
  ],
  exports: [
    CreateBookHandler,
    DeleteBookHandler,
    GetBookByIdHandler,
    GetBookBySlugHandler,
    GetBooksHandler,
    GetFiltersHandler,
    GetBookFiltersHandler,
    GetTopReadBooksHandler,
    UpdateBookHandler,
    ToggleBookLikeHandler,
    RecordBookViewHandler,
  ],
})
export class BooksApplicationModule {}
