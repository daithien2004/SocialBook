import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Bookmark,
  BookmarkSchema,
} from '@/infrastructure/database/schemas/bookmark.schema';
import { IBookmarkRepository } from '@/domain/bookmarks/repositories/bookmark.repository.interface';
import { MongooseBookmarkRepository } from './mongoose-bookmark.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bookmark.name, schema: BookmarkSchema },
    ]),
  ],
  providers: [
    {
      provide: IBookmarkRepository,
      useClass: MongooseBookmarkRepository,
    },
  ],
  exports: [IBookmarkRepository],
})
export class BookmarksRepositoryModule {}
