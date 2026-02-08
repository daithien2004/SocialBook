import { Module } from '@nestjs/common';
import { GenerateTextUseCase } from './use-cases/generate-text/generate-text.use-case';
import { SummarizeChapterUseCase } from './use-cases/summarize-chapter/summarize-chapter.use-case';
import { GeminiRepositoryModule } from '@/infrastructure/database/repositories/gemini/gemini-repository.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [GeminiRepositoryModule, InfrastructureModule],
  providers: [
    GenerateTextUseCase,
    SummarizeChapterUseCase,
  ],
  exports: [
    GenerateTextUseCase,
    SummarizeChapterUseCase,
  ],
})
export class GeminiApplicationModule {}
