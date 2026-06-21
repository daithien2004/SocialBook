import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { Module } from '@nestjs/common';
import { RecordBookViewUseCase } from './use-cases/record-book-view/record-book-view.use-case';
import { CreateBookUseCase } from './use-cases/create-book/create-book.use-case';
import { DeleteBookUseCase } from './use-cases/delete-book/delete-book.use-case';
import { GetBookByIdUseCase } from './use-cases/get-book-by-id/get-book-by-id.use-case';
import { GetBookBySlugUseCase } from './use-cases/get-book-by-slug/get-book-by-slug.use-case';
import { GetBooksUseCase } from './use-cases/get-books/get-books.use-case';
import { GetFiltersUseCase } from './use-cases/get-filters/get-filters.use-case';
import { GetBookFiltersUseCase } from './use-cases/get-book-filters/get-book-filters.use-case';
import { UpdateBookUseCase } from './use-cases/update-book/update-book.use-case';
import { ToggleBookLikeUseCase } from './use-cases/toggle-book-like/toggle-book-like.use-case';
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
  ],
  providers: [
    CreateBookUseCase,
    DeleteBookUseCase,
    GetBookByIdUseCase,
    GetBookBySlugUseCase,
    GetBooksUseCase,
    GetFiltersUseCase,
    GetBookFiltersUseCase,
    UpdateBookUseCase,
    ToggleBookLikeUseCase,
    RecordBookViewUseCase,
  ],
  exports: [
    CreateBookUseCase,
    DeleteBookUseCase,
    GetBookByIdUseCase,
    GetBookBySlugUseCase,
    GetBooksUseCase,
    GetFiltersUseCase,
    GetBookFiltersUseCase,
    UpdateBookUseCase,
    ToggleBookLikeUseCase,
    RecordBookViewUseCase,
  ],
})
export class BooksApplicationModule {}
