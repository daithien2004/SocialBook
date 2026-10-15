import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { IChapterKnowledgeRepository } from '@/modules/chapters/domain/chapters/repositories/chapter-knowledge.repository.interface';
import { ChapterRepository } from './chapter.repository';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { ChapterReadRepository } from './chapter-read.repository';
import { ChapterKnowledgeRepository } from './chapter-knowledge.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IChapterRepository,
      useClass: ChapterRepository,
    },
    {
      provide: IChapterReadRepository,
      useClass: ChapterReadRepository,
    },
    {
      provide: IChapterKnowledgeRepository,
      useClass: ChapterKnowledgeRepository,
    },
  ],
  exports: [
    IChapterRepository,
    IChapterReadRepository,
    IChapterKnowledgeRepository,
  ],
})
export class ChaptersRepositoryModule {}
