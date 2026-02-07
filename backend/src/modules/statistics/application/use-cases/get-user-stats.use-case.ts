import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/src/modules/users/domain/repositories/user.repository.interface';
import { UserStats } from '../../domain/models/statistics.model';

@Injectable()
export class GetUserStatsUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

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
            recentRegistrations
        ] = await Promise.all([
            this.userRepository.countByDate(new Date(0)),
            this.userRepository.findAll({ isVerified: true }, { page: 1, limit: 1 }).then(r => r.meta.total),
            this.userRepository.findAll({ isBanned: true }, { page: 1, limit: 1 }).then(r => r.meta.total),
            this.userRepository.countByProvider(),
            this.userRepository.getGrowthMetrics(thirtyDaysAgo, 'day')
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
            recentRegistrations: recentRegistrations.map(m => ({ date: m._id, count: m.count })),
        };
    }
}
