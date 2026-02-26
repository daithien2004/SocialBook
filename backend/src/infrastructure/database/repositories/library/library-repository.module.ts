import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { Collection, CollectionSchema } from '@/infrastructure/database/schemas/collection.schema';
import { Progress, ProgressSchema } from '@/infrastructure/database/schemas/progress.schema';
import { ReadingList, ReadingListSchema } from '@/infrastructure/database/schemas/reading-list.schema';
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
    MongooseModule,
    IReadingListRepository,
    IReadingProgressRepository,
    ICollectionRepository,
  ],
})
export class LibraryRepositoryModule { }
