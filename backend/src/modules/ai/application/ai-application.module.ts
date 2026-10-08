import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GenerateTextHandler } from './commands/generate-text/generate-text.handler';
import { SummarizeChapterHandler } from './commands/summarize-chapter/summarize-chapter.handler';
import { AIRequestRepositoryModule } from '@/modules/ai/infrastructure/repositories/ai-requests/ai-request-repository.module';
import { AIInfrastructureModule } from '@/modules/ai/infrastructure/public-api';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';

@Module({
  imports: [
    CqrsModule,
    AIRequestRepositoryModule,
    AIInfrastructureModule,
    IdGeneratorModule,
    ChaptersRepositoryModule,
  ],
  providers: [GenerateTextHandler, SummarizeChapterHandler],
  exports: [
    AIRequestRepositoryModule,
    AIInfrastructureModule,
    GenerateTextHandler,
    SummarizeChapterHandler,
  ],
})
export class AIApplicationModule {}
