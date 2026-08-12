import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProviderPort } from '@/domain/ai/interfaces/ai-provider.port';
import { IAIProviderFactoryPort } from '@/domain/ai/interfaces/ai-provider-factory.port';

@Injectable()
export class AIProviderFactory implements IAIProviderFactoryPort {
  constructor(
    private readonly providers: IAIProviderPort[],
    private readonly config: ConfigService,
  ) {

  }

  getProvider(name?: string): IAIProviderPort {
    const providerName = name ?? this.config.get<string>('env.AI_PROVIDER');
    const provider = this.providers.find(
      (p) => p.getProviderName() === providerName,
    );
    if (!provider) {
      throw new BadRequestException(`Unsupported AI provider: ${providerName}`);
    }
    return provider;
  }
}
