import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';

@Module({
  providers: [
    {
      provide: GEMINI_TOKENS.GEMINI_SERVICE,
      useClass: GeminiService,
    },
  ],
  exports: [GEMINI_TOKENS.GEMINI_SERVICE],
})
export class AIInfrastructureModule {}
