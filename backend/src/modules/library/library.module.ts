// src/modules/library/library.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { LibraryController } from './library.controller';
import { CollectionsController } from './collections.controller';

// Services
import { LibraryService } from './library.service';
import { CollectionsService } from './collections.service';
import { ReadingListRepository } from './reading-list.repository';

// Schemas
import { ReadingList, ReadingListSchema } from './schemas/reading-list.schema';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema';
import { Author, AuthorSchema } from '@/src/modules/authors/schemas/author.schema';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadingList.name, schema: ReadingListSchema },
      { name: Collection.name, schema: CollectionSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
    GamificationModule,
  ],
  controllers: [LibraryController, CollectionsController],
  providers: [LibraryService, CollectionsService, ReadingListRepository],
  exports: [LibraryService, ReadingListRepository]
})
export class LibraryModule { }
