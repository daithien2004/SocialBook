import { Module, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { GeminiService } from './gemini.service';
import { OpenAICompatibleClient } from './openai-compatible.client';

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
      provide: IGeminiService,
      useClass: GeminiService,
    },
  ],
  exports: [IGeminiService],
})
export class GeminiInfrastructureModule {}
