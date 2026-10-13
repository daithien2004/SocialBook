import { GetUserStatsQuery } from './get-user-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserStats } from '@/modules/statistics/domain/read-models/statistics.model';

@QueryHandler(GetUserStatsQuery)
export class GetUserStatsHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, verified, banned, byProvider, recentRegistrations] =
      await Promise.all([
        this.userRepository.countByDate(new Date(0)),
        this.userRepository
          .findAll({ isVerified: true }, { offset: 0, limit: 1 })
          .then((result) => result.total),
        this.userRepository
          .findAll({ isBanned: true }, { offset: 0, limit: 1 })
          .then((result) => result.total),
        this.userRepository.countByProvider(),
        this.userRepository.getGrowthMetrics(thirtyDaysAgo, 'day'),
      ]);

    return {
      total,
      verified,
      banned,
      byProvider: {
        local: byProvider.get('local') || 0,
        google: byProvider.get('google') || 0,
        facebook: byProvider.get('facebook') || 0,
      },
      recentRegistrations: recentRegistrations.map((m) => ({
        date: m._id,
        count: m.count,
      })),
    };
  }
}
