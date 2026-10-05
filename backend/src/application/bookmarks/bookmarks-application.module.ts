import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateBookmarkHandler } from './commands/create-bookmark/create-bookmark.handler';
import { DeleteBookmarkHandler } from './commands/delete-bookmark/delete-bookmark.handler';
import { GetBookmarksByBookHandler } from './queries/get-bookmarks-by-book/get-bookmarks-by-book.handler';
import { BookmarksRepositoryModule } from '@/infrastructure/database/repositories/bookmarks/bookmarks-repository.module';

@Module({
  imports: [BookmarksRepositoryModule, CqrsModule],
  providers: [
    CreateBookmarkHandler,
    DeleteBookmarkHandler,
    GetBookmarksByBookHandler,
  ],
  exports: [
    CreateBookmarkHandler,
    DeleteBookmarkHandler,
    GetBookmarksByBookHandler,
  ],
})
export class BookmarksApplicationModule {}
