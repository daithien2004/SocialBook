import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIRequest, AIRequestSchema } from '@/infrastructure/database/schemas/ai-request.schema';
import { GeminiService } from '../../services/gemini.service';
import { AIRequestRepository } from './ai-request.repository';
import { INFRASTRUCTURE_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AIRequest.name, schema: AIRequestSchema }]),
  ],
  providers: [
    {
      provide: INFRASTRUCTURE_TOKENS.GEMINI_SERVICE,
      useClass: GeminiService,
    },
    {
      provide: INFRASTRUCTURE_TOKENS.AI_REQUEST_REPOSITORY,
      useClass: AIRequestRepository,
    },
  ],
  exports: [
    MongooseModule,
    INFRASTRUCTURE_TOKENS.GEMINI_SERVICE,
    INFRASTRUCTURE_TOKENS.AI_REQUEST_REPOSITORY,
  ],
})
export class GeminiRepositoryModule {}
