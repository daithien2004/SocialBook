import type { AIRateLimitConfigReadModel } from '../read-models/ai-rate-limit-config.read-model';

export abstract class AIRateLimitConfigPort {
  abstract get(): Promise<AIRateLimitConfigReadModel>;
  abstract update(
    config: Partial<AIRateLimitConfigReadModel>,
  ): Promise<AIRateLimitConfigReadModel>;
}
