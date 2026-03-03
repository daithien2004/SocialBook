import { Module } from '@nestjs/common';
import { GenerateTextUseCase } from './use-cases/generate-text/generate-text.use-case';
import { SummarizeChapterUseCase } from './use-cases/summarize-chapter/summarize-chapter.use-case';
import { GeminiRepositoryModule } from '@/infrastructure/database/repositories/gemini/gemini-repository.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    GeminiRepositoryModule,
    InfrastructureModule,
    IdGeneratorModule,
  ],
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
