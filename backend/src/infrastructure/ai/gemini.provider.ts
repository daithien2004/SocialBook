import { Inject, Injectable } from '@nestjs/common';
import {
  AI_PROVIDER_NAMES,
  AIProviderName,
} from '@/domain/ai/interfaces/ai-provider.port';
import { OpenAICompatibleClient } from './openai-compatible.client';
import { OpenAIProviderBase } from './openai-provider.base';
import { GEMINI_CLIENT } from './provider-tokens';

@Injectable()
export class GeminiProvider extends OpenAIProviderBase {
  constructor(@Inject(GEMINI_CLIENT) client: OpenAICompatibleClient) {
    super(client);
  }

  getProviderName(): AIProviderName {
    return AI_PROVIDER_NAMES.GEMINI;
  }
}
