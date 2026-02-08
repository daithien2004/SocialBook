import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from '@/infrastructure/database/schemas/collection.schema';
import { ReadingList, ReadingListSchema } from '@/infrastructure/database/schemas/reading-list.schema';
import { Progress, ProgressSchema } from '@/infrastructure/database/schemas/progress.schema';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { ReadingListRepository } from './reading-list.repository';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
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
  ],
  exports: [
    MongooseModule,
    IReadingListRepository,
    IReadingProgressRepository,
  ],
})
export class LibraryRepositoryModule {}
