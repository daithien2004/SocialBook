import { Injectable, Logger } from '@nestjs/common';
import { IUserGamificationRepository } from '../../../domain/repositories/user-gamification.repository.interface';
import { IUserAchievementRepository } from '../../../domain/repositories/user-achievement.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { GetGamificationStatsCommand } from './get-gamification-stats.command';

@Injectable()
export class GetGamificationStatsUseCase {
    private readonly logger = new Logger(GetGamificationStatsUseCase.name);

    constructor(
        private readonly userGamificationRepository: IUserGamificationRepository,
        private readonly userAchievementRepository: IUserAchievementRepository
    ) {}

    async execute(command: GetGamificationStatsCommand) {
        try {
            if (command.userId) {
                // Get stats for specific user
                const userId = UserId.create(command.userId);
                
                const [gamification, unlockedCount, inProgress] = await Promise.all([
                    this.userGamificationRepository.findByUser(userId),
                    this.userAchievementRepository.countUnlockedByUser(userId),
                    this.userAchievementRepository.findInProgressByUser(userId)
                ]);

                if (!gamification) {
                    return {
                        userId: command.userId,
                        level: 1,
                        totalXP: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        streakFreezeCount: 2,
                        unlockedAchievements: 0,
                        inProgressAchievements: inProgress.length,
                        isStreakActive: false
                    };
                }

                return {
                    userId: command.userId,
                    level: gamification.getLevel(),
                    totalXP: gamification.totalXP.getValue(),
                    currentStreak: gamification.streak.getCurrent(),
                    longestStreak: gamification.streak.getLongest(),
                    streakFreezeCount: gamification.streakFreezeCount,
                    unlockedAchievements: unlockedCount,
                    inProgressAchievements: inProgress.length,
                    isStreakActive: gamification.isStreakActive(),
                    progressToNextLevel: gamification.getProgressToNextLevel(),
                    xpForNextLevel: gamification.getXPForNextLevel()
                };
            } else {
                // Get global stats
                const [totalXPDistributed, activeStreaks, topByStreak, topByXP] = await Promise.all([
                    this.userGamificationRepository.getTotalXPDistributed(),
                    this.userGamificationRepository.getActiveStreaksCount(),
                    this.userGamificationRepository.getTopUsersByStreak(10),
                    this.userGamificationRepository.getTopUsersByXP(10)
                ]);

                return {
                    totalXPDistributed,
                    activeStreaks,
                    topUsersByStreak: topByStreak.map(g => ({
                        userId: g.userId.toString(),
                        currentStreak: g.streak.getCurrent(),
                        longestStreak: g.streak.getLongest()
                    })),
                    topUsersByXP: topByXP.map(g => ({
                        userId: g.userId.toString(),
                        totalXP: g.totalXP.getValue(),
                        level: g.getLevel()
                    }))
                };
            }
        } catch (error) {
            this.logger.error('Failed to get gamification stats', error);
            throw error;
        }
    }
}
