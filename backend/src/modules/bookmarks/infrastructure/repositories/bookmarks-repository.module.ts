import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IBookmarkRepository } from '../../domain/repositories/bookmark.repository.interface';
import { PrismaBookmarkRepository } from './prisma-bookmark.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IBookmarkRepository,
      useClass: PrismaBookmarkRepository,
    },
  ],
  exports: [IBookmarkRepository],
})
export class BookmarksRepositoryModule {}
