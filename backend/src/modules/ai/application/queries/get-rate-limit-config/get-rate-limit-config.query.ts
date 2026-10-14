import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { AIRateLimitConfigReadModel } from '../../read-models/ai-rate-limit-config.read-model';

export class GetRateLimitConfigQuery extends Query<AIRateLimitConfigReadModel> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
