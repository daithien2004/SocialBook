import { IAIProviderPort, AIProviderName } from '@/modules/ai/domain';
import { OpenAICompatibleClient } from './openai-compatible.client';

export abstract class OpenAIProviderBase implements IAIProviderPort {
  protected constructor(protected readonly client: OpenAICompatibleClient) {}

  abstract getProviderName(): AIProviderName;

  async generateText(
    prompt: string,
    systemPrompt?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    return this.client.generateText(prompt, systemPrompt, signal);
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    return this.client.generateJSON<T>(prompt, systemPrompt);
  }

  async embedText(text: string): Promise<number[]> {
    return this.client.embedText(text);
  }
}
