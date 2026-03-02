import { Injectable, Logger } from '@nestjs/common';
import { IUserGamificationRepository } from '@/domain/gamification/repositories/user-gamification.repository.interface';
import { UserId } from '@/domain/gamification/value-objects/user-id.vo';
import { GetStreakQuery } from './get-streak.query';

@Injectable()
export class GetStreakUseCase {
    constructor(
        private readonly userGamificationRepository: IUserGamificationRepository,
    ) { }

    async execute(query: GetStreakQuery) {
        const userId = UserId.create(query.userId);
        const gamification = await this.userGamificationRepository.findByUser(userId);

        if (!gamification) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                streakFreezeCount: 2,
                isStreakActive: false,
            };
        }

        return {
            currentStreak: gamification.streak.getCurrent(),
            longestStreak: gamification.streak.getLongest(),
            streakFreezeCount: gamification.streakFreezeCount,
            isStreakActive: gamification.isStreakActive(),
        };
    }
}
