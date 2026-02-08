
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { ChapterRepository } from './repositories/chapter.repository';
import { IChapterRepository } from '../domain/repositories/chapter.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Chapter.name, schema: ChapterSchema }]),
    ],
    providers: [
        {
            provide: IChapterRepository,
            useClass: ChapterRepository,
        },
    ],
    exports: [
        IChapterRepository,
    ],
})
export class ChaptersInfrastructureModule {}
