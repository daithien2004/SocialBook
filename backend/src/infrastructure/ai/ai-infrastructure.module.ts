import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';

@Module({
  providers: [
    {
      provide: IGeminiService,
      useClass: GeminiService,
    },
  ],
  exports: [IGeminiService],
})
export class AIInfrastructureModule {}

