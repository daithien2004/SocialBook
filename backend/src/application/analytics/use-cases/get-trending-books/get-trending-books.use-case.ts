import { Injectable } from '@nestjs/common';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';

@Injectable()
export class GetTrendingBooksUseCase {
  constructor(private readonly analyticsRepository: IUserAnalyticsRepository) {}

  async execute(days = 1, limit = 5) {
    return this.analyticsRepository.getTrendingBooks(days, limit);
  }
}
