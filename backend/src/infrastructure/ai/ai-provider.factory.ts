import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProviderPort } from '@/domain/ai/interfaces/ai-provider.port';
import { IAIProviderFactoryPort } from '@/domain/ai/interfaces/ai-provider-factory.port';
import { GeminiProvider } from './gemini.provider';
import { ChatGPTProvider } from './chatgpt.provider';

@Injectable()
export class AIProviderFactory implements IAIProviderFactoryPort {
  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly chatGPTProvider: ChatGPTProvider,
    private readonly config: ConfigService,
  ) {}

  getProvider(name?: string): IAIProviderPort {
    const providerName = name ?? this.config.get<string>('env.AI_PROVIDER');
    const providers: IAIProviderPort[] = [
      this.geminiProvider,
      this.chatGPTProvider,
    ];
    const provider = providers.find(
      (p) => p.getProviderName() === providerName,
    );
    if (!provider) {
      throw new BadRequestException(`Unsupported AI provider: ${providerName}`);
    }
    return provider;
  }
}
