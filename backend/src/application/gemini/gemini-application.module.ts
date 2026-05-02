import { Module } from '@nestjs/common';
import { GenerateTextUseCase } from './use-cases/generate-text/generate-text.use-case';
import { SummarizeChapterUseCase } from './use-cases/summarize-chapter/summarize-chapter.use-case';
import { GeminiRepositoryModule } from '@/infrastructure/database/repositories/gemini/gemini-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';


@Module({
  imports: [GeminiRepositoryModule, IdGeneratorModule],
  providers: [GenerateTextUseCase, SummarizeChapterUseCase],
  exports: [GeminiRepositoryModule, GenerateTextUseCase, SummarizeChapterUseCase],

})

export class GeminiApplicationModule {}
