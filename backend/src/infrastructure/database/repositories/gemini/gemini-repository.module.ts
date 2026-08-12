import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AIRequest,
  AIRequestSchema,
} from '@/infrastructure/database/schemas/ai-request.schema';
import { GeminiInfrastructureModule } from '../../../gemini/gemini-infrastructure.module';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { IAIRequestRepository } from '@/domain/gemini/repositories/ai-request.repository.interface';
import { AIRequestRepository } from './ai-request.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIRequest.name, schema: AIRequestSchema },
    ]),
    GeminiInfrastructureModule,
  ],
  providers: [
    {
      provide: IAIRequestRepository,
      useClass: AIRequestRepository,
    },
  ],
  exports: [MongooseModule, IGeminiService, IAIRequestRepository],
})
export class GeminiRepositoryModule {}
