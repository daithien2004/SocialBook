import { Module } from '@nestjs/common';
import { GenerateTextUseCase } from './use-cases/generate-text/generate-text.use-case';
import { SummarizeChapterUseCase } from './use-cases/summarize-chapter/summarize-chapter.use-case';
import { AIRequestRepositoryModule } from '@/infrastructure/database/repositories/ai-requests/ai-request-repository.module';
import { AIInfrastructureModule } from '@/infrastructure/ai/ai-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';

@Module({
  imports: [
    AIRequestRepositoryModule,
    AIInfrastructureModule,
    IdGeneratorModule,
    ChaptersRepositoryModule,
  ],
  providers: [GenerateTextUseCase, SummarizeChapterUseCase],
  exports: [
    AIRequestRepositoryModule,
    AIInfrastructureModule,
    GenerateTextUseCase,
    SummarizeChapterUseCase,
  ],
})
export class AIApplicationModule {}
