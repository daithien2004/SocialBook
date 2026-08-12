import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AIRequest,
  AIRequestSchema,
} from '@/infrastructure/database/schemas/ai-request.schema';
import { IAIRequestRepository } from '@/domain/ai/repositories/ai-request.repository.interface';
import { AIRequestRepository } from './ai-request.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIRequest.name, schema: AIRequestSchema },
    ]),
  ],
  providers: [
    {
      provide: IAIRequestRepository,
      useClass: AIRequestRepository,
    },
  ],
  exports: [IAIRequestRepository],
})
export class AIRequestRepositoryModule {}
