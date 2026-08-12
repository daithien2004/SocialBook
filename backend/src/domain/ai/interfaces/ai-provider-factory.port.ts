import { IAIProviderPort } from './ai-provider.port';

export abstract class IAIProviderFactoryPort {
  abstract getProvider(name?: string): IAIProviderPort;
}
