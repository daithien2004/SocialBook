import { Module, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { OpenAICompatibleClient } from './openai-compatible.client';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';

@Module({
  providers: [
    {
      provide: OpenAICompatibleClient,
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('env.MODERATION_API_KEY');
        if (!apiKey) {
          throw new InternalServerErrorException(
            'MODERATION_API_KEY is not configured. GeminiService cannot start.',
          );
        }

        return new OpenAICompatibleClient({
          apiKey,
          baseUrl:
            config.get<string>('env.MODERATION_API_BASE_URL') ??
            'https://platform.beeknoee.com/v1',
          model:
            config.get<string>('env.MODERATION_MODEL') ??
            'gemini-2.5-flash-lite',
          timeout: config.get<number>('env.MODERATION_TIMEOUT') ?? 60_000,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: GEMINI_TOKENS.GEMINI_SERVICE,
      useClass: GeminiService,
    },
  ],
  exports: [GEMINI_TOKENS.GEMINI_SERVICE, OpenAICompatibleClient],
})
export class AIInfrastructureModule {}
