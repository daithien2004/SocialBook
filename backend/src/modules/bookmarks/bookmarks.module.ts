import { Module } from '@nestjs/common';
import { BookmarksApplicationModule } from './application/bookmarks-application.module';
import { BookmarkController } from './presentation/bookmark.controller';

@Module({
  imports: [BookmarksApplicationModule],
  controllers: [BookmarkController],
})
export class BookmarksModule {}
