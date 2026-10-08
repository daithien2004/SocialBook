import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AIRequest,
  AIRequestSchema,
} from '@/modules/ai/infrastructure/schemas/ai-request.schema';
import { IAIRequestRepository } from '@/modules/ai/domain';
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
