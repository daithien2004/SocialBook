import { Injectable } from '@nestjs/common';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';

@Injectable()
export class GetTopActiveReadersUseCase {
  constructor(private readonly analyticsRepository: IUserAnalyticsRepository) {}

  async execute(days = 7, limit = 5) {
    return this.analyticsRepository.getTopActiveReaders(days, limit);
  }
}
