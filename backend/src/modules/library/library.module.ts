import { Module } from '@nestjs/common';
import { LibraryApplicationModule } from './application/library/library-application.module';
import { CollectionsController } from './presentation/collections/collections.controller';
import { LibraryController } from './presentation/library/library.controller';

@Module({
  imports: [LibraryApplicationModule],
  controllers: [CollectionsController, LibraryController],
})
export class LibraryModule {}
