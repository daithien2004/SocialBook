import { Inject, Injectable } from '@nestjs/common';
import {
  AI_PROVIDER_NAMES,
  AIProviderName,
} from '@/domain/ai/interfaces/ai-provider.port';
import { OpenAICompatibleClient } from './openai-compatible.client';
import { OpenAIProviderBase } from './openai-provider.base';
import { CHATGPT_CLIENT } from './provider-tokens';

@Injectable()
export class ChatGPTProvider extends OpenAIProviderBase {
  constructor(@Inject(CHATGPT_CLIENT) client: OpenAICompatibleClient) {
    super(client);
  }

  getProviderName(): AIProviderName {
    return AI_PROVIDER_NAMES.CHATGPT;
  }
}
