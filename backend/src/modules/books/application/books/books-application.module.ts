import { CqrsModule } from '@nestjs/cqrs';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { AuthorsInfrastructureModule } from '@/modules/authors/infrastructure/authors-infrastructure.module';
import { GenresInfrastructureModule } from '@/modules/genres/infrastructure/genres-infrastructure.module';
import { Module } from '@nestjs/common';
import { RecordBookViewHandler } from './commands/record-book-view/record-book-view.handler';
import { CreateBookHandler } from './commands/create-book/create-book.handler';
import { DeleteBookHandler } from './commands/delete-book/delete-book.handler';
import { GetBookByIdHandler } from './queries/get-book-by-id/get-book-by-id.handler';
import { GetBookBySlugHandler } from './queries/get-book-by-slug/get-book-by-slug.handler';
import { GetBooksHandler } from './queries/get-books/get-books.handler';
import { GetFiltersHandler } from './queries/get-filters/get-filters.handler';
import { GetBookFiltersHandler } from './queries/get-book-filters/get-book-filters.handler';
import { GetTopReadBooksHandler } from './queries/get-top-read-books/get-top-read-books.handler';
import { UpdateBookHandler } from './commands/update-book/update-book.handler';
import { ToggleBookLikeHandler } from './commands/toggle-book-like/toggle-book-like.handler';
import { LikesApplicationModule } from '@/modules/likes/application/likes-application.module';
import { ReviewsInfrastructureModule } from '@/modules/reviews/infrastructure/reviews-infrastructure.module';

@Module({
  imports: [
    BooksRepositoryModule,
    AuthorsInfrastructureModule,
    GenresInfrastructureModule,
    IdGeneratorModule,
    LikesApplicationModule,
    ReviewsInfrastructureModule,
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
