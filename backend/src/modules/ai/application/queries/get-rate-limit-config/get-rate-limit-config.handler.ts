import { ForbiddenError } from '@casl/ability';
import { QueryHandler } from '@nestjs/cqrs';
import { AIRateLimitConfigPort } from '../../ports/ai-rate-limit-config.port';
import { GetRateLimitConfigQuery } from './get-rate-limit-config.query';

@QueryHandler(GetRateLimitConfigQuery)
export class GetRateLimitConfigHandler {
  constructor(private readonly config: AIRateLimitConfigPort) {}

  execute(query: GetRateLimitConfigQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      'AIRateLimitConfiguration',
    );
    return this.config.get();
  }
}
