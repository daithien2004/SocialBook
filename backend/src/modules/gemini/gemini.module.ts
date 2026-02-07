import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Presentation layer imports
import { GeminiController } from './presentation/gemini.controller';

// Application layer imports - Use Cases
import { GenerateTextUseCase } from './application/use-cases/generate-text/generate-text.use-case';
import { SummarizeChapterUseCase } from './application/use-cases/summarize-chapter/summarize-chapter.use-case';

// Infrastructure layer imports
import { GeminiService } from './infrastructure/services/gemini.service';
import { AIRequestRepository } from './infrastructure/repositories/ai-request.repository';
import { AIRequestSchema, AIRequestSchemaDefinition } from './infrastructure/schemas/ai-request.schema';

// Domain layer imports
import { INFRASTRUCTURE_TOKENS } from './domain/tokens/gemini.tokens';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([
      { name: AIRequestSchema.name, schema: AIRequestSchemaDefinition }
    ])
  ],
  controllers: [GeminiController],
  providers: [
    {
      provide: INFRASTRUCTURE_TOKENS.GEMINI_SERVICE,
      useClass: GeminiService
    },
    {
      provide: INFRASTRUCTURE_TOKENS.AI_REQUEST_REPOSITORY,
      useClass: AIRequestRepository
    },
    GenerateTextUseCase,
    SummarizeChapterUseCase,
  ],
  exports: [
    INFRASTRUCTURE_TOKENS.GEMINI_SERVICE,
    INFRASTRUCTURE_TOKENS.AI_REQUEST_REPOSITORY,
    GenerateTextUseCase,
    SummarizeChapterUseCase,
  ],
})
export class GeminiModule {}
