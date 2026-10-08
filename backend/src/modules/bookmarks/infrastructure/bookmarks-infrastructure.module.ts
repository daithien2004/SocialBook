import { Module } from '@nestjs/common';
import { BookmarksRepositoryModule } from './repositories/bookmarks-repository.module';

@Module({
  imports: [BookmarksRepositoryModule],
  exports: [BookmarksRepositoryModule],
})
export class BookmarksInfrastructureModule {}
