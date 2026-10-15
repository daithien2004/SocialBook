import { CqrsModule } from '@nestjs/cqrs';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { Module } from '@nestjs/common';
import { RecordBookViewHandler } from './commands/record-book-view/record-book-view.handler';
import { CreateBookHandler } from './commands/create-book/create-book.handler';
import { DeleteBookHandler } from './commands/delete-book/delete-book.handler';
import { GetBookByIdHandler } from './queries/get-book-by-id/get-book-by-id.handler';
import { GetBookBySlugHandler } from './queries/get-book-by-slug/get-book-by-slug.handler';
import { GetBooksHandler } from './queries/get-books/get-books.handler';
import { GetBookFiltersHandler } from './queries/get-book-filters/get-book-filters.handler';
import { GetTopReadBooksHandler } from './queries/get-top-read-books/get-top-read-books.handler';
import { UpdateBookHandler } from './commands/update-book/update-book.handler';
import { ToggleBookLikeHandler } from './commands/toggle-book-like/toggle-book-like.handler';
import { LikesApplicationModule } from '@/modules/likes/application/public-api';
import { ReviewsInfrastructureModule } from '@/modules/reviews/infrastructure/public-api';
import { ReadingRoomsReferenceModule } from '@/modules/reading-rooms';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { NotificationsApplicationModule } from '@/modules/notifications/application/public-api';

@Module({
  imports: [
    BooksRepositoryModule,
    IdGeneratorModule,
    LikesApplicationModule,
    ReviewsInfrastructureModule,
    ReadingRoomsReferenceModule,
    MediaInfrastructureModule,
    NotificationsApplicationModule,
    CqrsModule,
  ],
  providers: [
    CreateBookHandler,
    DeleteBookHandler,
    GetBookByIdHandler,
    GetBookBySlugHandler,
    GetBooksHandler,
    GetBookFiltersHandler,
    GetTopReadBooksHandler,
    UpdateBookHandler,
    ToggleBookLikeHandler,
    RecordBookViewHandler,
  ],
})
export class BooksApplicationModule {}
