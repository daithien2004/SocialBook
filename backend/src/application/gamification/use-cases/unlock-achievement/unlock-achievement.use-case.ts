import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { IUserAchievementRepository } from '@/domain/gamification/repositories/user-achievement.repository.interface';
import { IAchievementRepository } from '@/domain/gamification/repositories/achievement.repository.interface';
import { IUserGamificationRepository } from '@/domain/gamification/repositories/user-gamification.repository.interface';
import { UserAchievement } from '@/domain/gamification/entities/user-achievement.entity';
import { UserId } from '@/domain/gamification/value-objects/user-id.vo';
import { AchievementId } from '@/domain/gamification/value-objects/achievement-id.vo';
import { UnlockAchievementCommand } from './unlock-achievement.command';

@Injectable()
export class UnlockAchievementUseCase {
    private readonly logger = new Logger(UnlockAchievementUseCase.name);

    constructor(
        private readonly userAchievementRepository: IUserAchievementRepository,
        private readonly achievementRepository: IAchievementRepository,
        private readonly userGamificationRepository: IUserGamificationRepository
    ) {}

    async execute(command: UnlockAchievementCommand): Promise<UserAchievement> {
        try {
            const userId = UserId.create(command.userId);
            const achievementId = AchievementId.create(command.achievementId);

            // Check if achievement exists
            const achievement = await this.achievementRepository.findById(achievementId);
            if (!achievement) {
                throw new NotFoundException('Achievement not found');
            }

            // Find existing user achievement or create new one
            let userAchievement = await this.userAchievementRepository.findByUserAndAchievement(
                userId,
                achievementId
            );

            if (userAchievement) {
                if (userAchievement.isUnlocked) {
                    throw new ConflictException('Achievement already unlocked');
                }
            } else {
                userAchievement = UserAchievement.create({
                    userId: command.userId,
                    achievementId: command.achievementId,
                    rewardXP: achievement.requirement.value
                });
            }

            // Update progress if provided
            if (command.progress !== undefined) {
                userAchievement.updateProgress(command.progress);
            }

            // Check if achievement should be unlocked
            if (userAchievement.progress >= achievement.requirement.value) {
                userAchievement.unlock();
                
                // Award XP to user
                const gamification = await this.userGamificationRepository.findByUser(userId);
                if (gamification) {
                    gamification.addXP(userAchievement.rewardXP.getValue());
                    await this.userGamificationRepository.save(gamification);
                }
            }

            // Save user achievement
            await this.userAchievementRepository.save(userAchievement);

            this.logger.log(`Achievement ${command.achievementId} progress updated for user ${command.userId}`);

            return userAchievement;
        } catch (error) {
            this.logger.error(`Failed to unlock achievement ${command.achievementId} for user ${command.userId}`, error);
            throw error;
        }
    }
}


