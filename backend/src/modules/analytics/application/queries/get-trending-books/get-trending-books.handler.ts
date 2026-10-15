import { GetTrendingBooksQuery } from './get-trending-books.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserAnalyticsRepository } from '@/modules/analytics/domain/repositories/user-analytics.repository.interface';
import { ForbiddenError } from '@casl/ability';

@QueryHandler(GetTrendingBooksQuery)
export class GetTrendingBooksHandler implements IQueryHandler<GetTrendingBooksQuery> {
  constructor(private readonly analyticsRepository: IUserAnalyticsRepository) {}

  async execute(query: GetTrendingBooksQuery) {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      'Analytics',
    );
    return this.analyticsRepository.getTrendingBooks(
      query.days ?? 1,
      query.limit ?? 5,
    );
  }
}
