import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AIRequest,
  AIRequestSchema,
} from '@/infrastructure/database/schemas/ai-request.schema';
import { GeminiService } from '../../../ai/gemini.service';
import { AIRequestRepository } from './ai-request.repository';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIRequest.name, schema: AIRequestSchema },
    ]),
  ],
  providers: [
    {
      provide: GEMINI_TOKENS.GEMINI_SERVICE,
      useClass: GeminiService,
    },
    {
      provide: GEMINI_TOKENS.AI_REQUEST_REPOSITORY,
      useClass: AIRequestRepository,
    },
  ],
  exports: [
    MongooseModule,
    GEMINI_TOKENS.GEMINI_SERVICE,
    GEMINI_TOKENS.AI_REQUEST_REPOSITORY,
  ],
})
export class GeminiRepositoryModule {}
