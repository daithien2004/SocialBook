import { Module } from '@nestjs/common';
import { CreateBookmarkUseCase } from './use-cases/create-bookmark/create-bookmark.use-case';
import { DeleteBookmarkUseCase } from './use-cases/delete-bookmark/delete-bookmark.use-case';
import { GetBookmarksByBookUseCase } from './use-cases/get-bookmarks-by-book/get-bookmarks-by-book.use-case';
import { BookmarksRepositoryModule } from '@/infrastructure/database/repositories/bookmarks/bookmarks-repository.module';

@Module({
  imports: [BookmarksRepositoryModule],
  providers: [
    CreateBookmarkUseCase,
    DeleteBookmarkUseCase,
    GetBookmarksByBookUseCase,
  ],
  exports: [
    CreateBookmarkUseCase,
    DeleteBookmarkUseCase,
    GetBookmarksByBookUseCase,
  ],
})
export class BookmarksApplicationModule {}
