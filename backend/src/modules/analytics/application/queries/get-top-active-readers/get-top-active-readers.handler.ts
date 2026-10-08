import { GetTopActiveReadersQuery } from './get-top-active-readers.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IUserAnalyticsRepository } from '@/modules/analytics/domain/repositories/user-analytics.repository.interface';

@QueryHandler(GetTopActiveReadersQuery)
export class GetTopActiveReadersHandler {
  constructor(private readonly analyticsRepository: IUserAnalyticsRepository) {}

  async execute(days = 7, limit = 5) {
    return this.analyticsRepository.getTopActiveReaders(days, limit);
  }
}
