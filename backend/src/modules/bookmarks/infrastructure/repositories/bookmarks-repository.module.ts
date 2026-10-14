import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { BookmarkRepository } from '../../domain/repositories/bookmark.repository';
import { PrismaBookmarkRepository } from './prisma-bookmark.repository';
import { BookmarkReadRepository } from '../../application/ports/bookmark-read.repository';
import { PrismaBookmarkReadRepository } from './prisma-bookmark-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: BookmarkRepository,
      useClass: PrismaBookmarkRepository,
    },
    {
      provide: BookmarkReadRepository,
      useClass: PrismaBookmarkReadRepository,
    },
  ],
  exports: [BookmarkRepository, BookmarkReadRepository],
})
export class BookmarksRepositoryModule {}
