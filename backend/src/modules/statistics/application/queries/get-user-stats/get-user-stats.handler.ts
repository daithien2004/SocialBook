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

    const [
      total,
      verified, // I need to verify if findAll allows counting specifically or if I need to add countByVerification.
      // I added findAll which returns total in meta, but asking for limit 1 to get total is a bit hacky but valid for clean arch if specific method absent.
      // Let's use `findAll` with limit 1 for filtered counts.
      banned,
      byProvider,
      recentRegistrations,
    ] = await Promise.all([
      this.userRepository.countByDate(new Date(0)),
      this.userRepository
        .findAll({ isVerified: true }, { page: 1, limit: 1 })
        .then((r) => r.meta.total),
      this.userRepository
        .findAll({ isBanned: true }, { page: 1, limit: 1 })
        .then((r) => r.meta.total),
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
