import { GetTopActiveReadersQuery } from './get-top-active-readers.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserAnalyticsRepository } from '@/modules/analytics/domain/repositories/user-analytics.repository.interface';
import { ForbiddenError } from '@casl/ability';

@QueryHandler(GetTopActiveReadersQuery)
export class GetTopActiveReadersHandler implements IQueryHandler<GetTopActiveReadersQuery> {
  constructor(private readonly analyticsRepository: IUserAnalyticsRepository) {}

  async execute(query: GetTopActiveReadersQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      'Analytics',
    );
    return this.analyticsRepository.getTopActiveReaders(
      query.days ?? 7,
      query.limit ?? 5,
    );
  }
}
