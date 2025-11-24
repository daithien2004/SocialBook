// src/modules/library/library.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { LibraryController } from './library.controller';
import { CollectionsController } from './collections.controller';

// Services
import { LibraryService } from './library.service';
import { CollectionsService } from './collections.service';

// Schemas
import { ReadingList, ReadingListSchema } from './schemas/reading-list.schema';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema';
import { Author, AuthorSchema } from '@/src/modules/authors/schemas/author.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadingList.name, schema: ReadingListSchema },
      { name: Collection.name, schema: CollectionSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Author.name, schema: AuthorSchema },
    ]),
  ],
  controllers: [LibraryController, CollectionsController],
  providers: [LibraryService, CollectionsService],
  exports: [LibraryService], // Export nếu module khác cần dùng
})
export class LibraryModule {}
