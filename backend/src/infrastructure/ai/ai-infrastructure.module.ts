import { Module, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIPort } from '@/domain/ai/interfaces/ai.port';
import {
  AI_PROVIDER_NAMES,
  AIProviderName,
  IAIProviderPort,
} from '@/domain/ai/interfaces/ai-provider.port';
import { IAIProviderFactoryPort } from '@/domain/ai/interfaces/ai-provider-factory.port';
import { AIAdapter } from './ai.adapter';
import { GeminiProvider } from './gemini.provider';
import { ChatGPTProvider } from './chatgpt.provider';
import { AIProviderFactory } from './ai-provider.factory';
import { GEMINI_CLIENT, CHATGPT_CLIENT } from './provider-tokens';
import { OpenAICompatibleClient } from './openai-compatible.client';

interface ClientConfig {
  apiKeyKey: string;
  baseUrlKey: string;
  modelKey: string;
  timeoutKey: string;
}

interface ClientDefaults {
  baseUrl: string;
  model: string;
  timeout: number;
}

const GEMINI_CLIENT_CONFIG: ClientConfig = {
  apiKeyKey: 'env.MODERATION_API_KEY',
  baseUrlKey: 'env.MODERATION_API_BASE_URL',
  modelKey: 'env.MODERATION_MODEL',
  timeoutKey: 'env.MODERATION_TIMEOUT',
};

const GEMINI_DEFAULTS: ClientDefaults = {
  baseUrl: 'https://platform.beeknoee.com/v1',
  model: 'gemini-2.5-flash-lite',
  timeout: 60_000,
};

const CHATGPT_CLIENT_CONFIG: ClientConfig = {
  apiKeyKey: 'env.CHATGPT_API_KEY',
  baseUrlKey: 'env.CHATGPT_BASE_URL',
  modelKey: 'env.CHATGPT_MODEL',
  timeoutKey: 'env.CHATGPT_TIMEOUT',
};

const CHATGPT_DEFAULTS: ClientDefaults = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  timeout: 60_000,
};

function createClient(
  config: ConfigService,
  providerName: AIProviderName,
  clientConfig: ClientConfig,
  defaults: ClientDefaults,
): OpenAICompatibleClient {
  const activeProvider =
    config.get<string>('env.AI_PROVIDER') ?? AI_PROVIDER_NAMES.GEMINI;
  const apiKey = config.get<string>(clientConfig.apiKeyKey);

  if (activeProvider === providerName && !apiKey) {
    throw new InternalServerErrorException(
      `${clientConfig.apiKeyKey} is not configured. AIAdapter cannot start with ${providerName} provider.`,
    );
  }

  return new OpenAICompatibleClient({
    apiKey: apiKey ?? '',
    baseUrl: config.get<string>(clientConfig.baseUrlKey) ?? defaults.baseUrl,
    model: config.get<string>(clientConfig.modelKey) ?? defaults.model,
    timeout: config.get<number>(clientConfig.timeoutKey) ?? defaults.timeout,
  });
}

@Module({
  providers: [
    {
      provide: GEMINI_CLIENT,
      useFactory: (config: ConfigService) =>
        createClient(
          config,
          AI_PROVIDER_NAMES.GEMINI,
          GEMINI_CLIENT_CONFIG,
          GEMINI_DEFAULTS,
        ),
      inject: [ConfigService],
    },
    {
      provide: CHATGPT_CLIENT,
      useFactory: (config: ConfigService) =>
        createClient(
          config,
          AI_PROVIDER_NAMES.CHATGPT,
          CHATGPT_CLIENT_CONFIG,
          CHATGPT_DEFAULTS,
        ),
      inject: [ConfigService],
    },
    GeminiProvider,
    ChatGPTProvider,
    {
      provide: IAIProviderFactoryPort,
      useClass: AIProviderFactory,
    },
    {
      provide: IAIPort,
      useClass: AIAdapter,
    },
  ],
  exports: [IAIPort, IAIProviderFactoryPort],
})
export class AIInfrastructureModule {}
