import { Module } from '@nestjs/common';
import { BookmarksRepositoryModule } from '@/infrastructure/database/repositories/bookmarks/bookmarks-repository.module';
import { CreateBookmarkUseCase } from '@/application/bookmarks/commands/create-bookmark.use-case';
import { DeleteBookmarkUseCase } from '@/application/bookmarks/commands/delete-bookmark.use-case';
import { GetBookmarksByBookUseCase } from '@/application/bookmarks/queries/get-bookmarks-by-book.use-case';
import { BookmarkController } from './bookmark.controller';

@Module({
  imports: [BookmarksRepositoryModule],
  controllers: [BookmarkController],
  providers: [
    CreateBookmarkUseCase,
    DeleteBookmarkUseCase,
    GetBookmarksByBookUseCase,
  ],
  exports: [BookmarksRepositoryModule],
})
export class BookmarkModule {}
