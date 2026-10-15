import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { AIRateLimitConfigPort } from '../../ports/ai-rate-limit-config.port';
import { GetRateLimitConfigQuery } from './get-rate-limit-config.query';
import { ForbiddenError } from '@casl/ability';

@QueryHandler(GetRateLimitConfigQuery)
export class GetRateLimitConfigHandler implements IQueryHandler<GetRateLimitConfigQuery> {
  constructor(private readonly config: AIRateLimitConfigPort) {}

  execute(query: GetRateLimitConfigQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      'AIRateLimitConfiguration',
    );
    return this.config.get();
  }
}
