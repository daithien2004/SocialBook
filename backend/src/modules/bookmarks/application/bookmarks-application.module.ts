import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateBookmarkHandler } from './commands/create-bookmark/create-bookmark.handler';
import { DeleteBookmarkHandler } from './commands/delete-bookmark/delete-bookmark.handler';
import { GetBookmarksByBookHandler } from './queries/get-bookmarks-by-book/get-bookmarks-by-book.handler';
import { BookmarksInfrastructureModule } from '../infrastructure/bookmarks-infrastructure.module';

@Module({
  imports: [BookmarksInfrastructureModule, CqrsModule],
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
