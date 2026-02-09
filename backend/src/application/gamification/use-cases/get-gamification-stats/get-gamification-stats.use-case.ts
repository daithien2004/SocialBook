import { Injectable, Logger } from '@nestjs/common';
import { IUserGamificationRepository } from '@/domain/gamification/repositories/user-gamification.repository.interface';
import { IUserAchievementRepository } from '@/domain/gamification/repositories/user-achievement.repository.interface';
import { UserId } from '@/domain/gamification/value-objects/user-id.vo';
import { GetGamificationStatsQuery } from './get-gamification-stats.query';

@Injectable()
export class GetGamificationStatsUseCase {
    private readonly logger = new Logger(GetGamificationStatsUseCase.name);

    constructor(
        private readonly userGamificationRepository: IUserGamificationRepository,
        private readonly userAchievementRepository: IUserAchievementRepository,
    ) { }

    async execute(query: GetGamificationStatsQuery) {
        try {
            if (query.userId) {
                return this.getUserStats(query.userId);
            }
            return this.getGlobalStats();
        } catch (error) {
            this.logger.error('Failed to get gamification stats', error);
            throw error;
        }
    }

    private async getUserStats(userIdStr: string) {
        const userId = UserId.create(userIdStr);
        const [gamification, unlockedCount, inProgress] = await Promise.all([
            this.userGamificationRepository.findByUser(userId),
            this.userAchievementRepository.countUnlockedByUser(userId),
            this.userAchievementRepository.findInProgressByUser(userId),
        ]);

        if (!gamification) {
            return this.getDefaultStats(userIdStr, inProgress.length);
        }

        return {
            userId: userIdStr,
            level: gamification.getLevel(),
            totalXP: gamification.totalXP.getValue(),
            currentStreak: gamification.streak.getCurrent(),
            longestStreak: gamification.streak.getLongest(),
            streakFreezeCount: gamification.streakFreezeCount,
            unlockedAchievements: unlockedCount,
            inProgressAchievements: inProgress.length,
            isStreakActive: gamification.isStreakActive(),
            progressToNextLevel: gamification.getProgressToNextLevel(),
            xpForNextLevel: gamification.getXPForNextLevel(),
        };
    }

    private async getGlobalStats() {
        const [totalXPDistributed, activeStreaks, topByStreak, topByXP] = await Promise.all([
            this.userGamificationRepository.getTotalXPDistributed(),
            this.userGamificationRepository.getActiveStreaksCount(),
            this.userGamificationRepository.getTopUsersByStreak(10),
            this.userGamificationRepository.getTopUsersByXP(10),
        ]);

        return {
            totalXPDistributed,
            activeStreaks,
            topUsersByStreak: topByStreak.map((g) => ({
                userId: g.userId.toString(),
                currentStreak: g.streak.getCurrent(),
                longestStreak: g.streak.getLongest(),
            })),
            topUsersByXP: topByXP.map((g) => ({
                userId: g.userId.toString(),
                totalXP: g.totalXP.getValue(),
                level: g.getLevel(),
            })),
        };
    }

    private getDefaultStats(userId: string, inProgressCount: number) {
        return {
            userId,
            level: 1,
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            streakFreezeCount: 2,
            unlockedAchievements: 0,
            inProgressAchievements: inProgressCount,
            isStreakActive: false,
        };
    }
}
