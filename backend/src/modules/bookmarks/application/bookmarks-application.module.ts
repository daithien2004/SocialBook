import { Module } from '@nestjs/common';
import { BookmarksInfrastructureModule } from '../infrastructure/bookmarks-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [BookmarksInfrastructureModule, IdGeneratorModule],
  providers: [BookmarksService],
  exports: [BookmarksService],
})
export class BookmarksApplicationModule {}
