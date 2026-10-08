import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/modules/library/domain/library/repositories/reading-progress.repository.interface';
import {
  Collection,
  CollectionSchema,
} from '@/modules/library/infrastructure/schemas/collection.schema';
import {
  Progress,
  ProgressSchema,
} from '@/modules/library/infrastructure/schemas/progress.schema';
import {
  ReadingList,
  ReadingListSchema,
} from '@/modules/library/infrastructure/schemas/reading-list.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionRepository } from './collection.repository';
import { ReadingListRepository } from './reading-list.repository';
import { ReadingProgressRepository } from './reading-progress.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collection.name, schema: CollectionSchema },
      { name: ReadingList.name, schema: ReadingListSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  providers: [
    {
      provide: IReadingListRepository,
      useClass: ReadingListRepository,
    },
    {
      provide: IReadingProgressRepository,
      useClass: ReadingProgressRepository,
    },
    {
      provide: ICollectionRepository,
      useClass: CollectionRepository,
    },
  ],
  exports: [
    IReadingListRepository,
    IReadingProgressRepository,
    ICollectionRepository,
  ],
})
export class LibraryRepositoryModule {}
