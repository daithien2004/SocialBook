
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadingList, ReadingListSchema } from './schemas/reading-list.schema';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import { Progress, ProgressSchema } from '../../progress/schemas/progress.schema';
import { Author, AuthorSchema } from '../../authors/infrastructure/schemas/author.schema';
import { Chapter, ChapterSchema } from '../../chapters/infrastructure/schemas/chapter.schema';
import { ReadingListRepository } from './repositories/reading-list.repository';
import { ReadingProgressRepository } from './repositories/reading-progress.repository';
import { IReadingListRepository } from '../domain/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '../domain/repositories/reading-progress.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ReadingList.name, schema: ReadingListSchema },
            { name: Collection.name, schema: CollectionSchema },
            { name: Progress.name, schema: ProgressSchema },
            { name: Author.name, schema: AuthorSchema },
            { name: Chapter.name, schema: ChapterSchema },
        ]),
    ],
    providers: [
        { provide: IReadingListRepository, useClass: ReadingListRepository },
        { provide: IReadingProgressRepository, useClass: ReadingProgressRepository },
    ],
    exports: [
        IReadingListRepository,
        IReadingProgressRepository,
        MongooseModule,
    ],
})
export class LibraryInfrastructureModule {}
