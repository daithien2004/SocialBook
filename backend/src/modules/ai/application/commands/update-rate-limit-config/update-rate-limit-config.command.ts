import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { AIRateLimitConfigReadModel } from '../../read-models/ai-rate-limit-config.read-model';

export class UpdateRateLimitConfigCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly config: Partial<AIRateLimitConfigReadModel>,
  ) {
    super();
  }
}
