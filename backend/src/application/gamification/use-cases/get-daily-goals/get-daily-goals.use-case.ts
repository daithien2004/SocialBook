import { Injectable, Logger } from '@nestjs/common';
import { IUserGamificationRepository } from '@/domain/gamification/repositories/user-gamification.repository.interface';
import { UserId } from '@/domain/gamification/value-objects/user-id.vo';
import { GetDailyGoalsQuery } from './get-daily-goals.query';

@Injectable()
export class GetDailyGoalsUseCase {
    private readonly logger = new Logger(GetDailyGoalsUseCase.name);

    constructor(
        private readonly userGamificationRepository: IUserGamificationRepository
    ) {}

    async execute(query: GetDailyGoalsQuery) {
        try {
            const userId = UserId.create(query.userId);
            const gamification = await this.userGamificationRepository.findByUser(userId);
            
            // Determine "Check In" goal completion
            let isCheckInCompleted = false;
            if (gamification && gamification.lastReadDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const lastDate = new Date(gamification.lastReadDate);
                lastDate.setHours(0, 0, 0, 0);
                
                if (today.getTime() === lastDate.getTime()) {
                    isCheckInCompleted = true;
                }
            }

            // Return mock goals
            return [
                {
                    id: '1',
                    title: 'Daily Check-in',
                    description: 'Log in to the app today',
                    xpReward: 10,
                    progress: isCheckInCompleted ? 1 : 0,
                    target: 1,
                    isCompleted: isCheckInCompleted,
                    type: 'CHECK_IN'
                },
                {
                    id: '2',
                    title: 'Read 1 Chapter',
                    description: 'Read at least one chapter today',
                    xpReward: 20,
                    progress: 0, // Mocked for now
                    target: 1,
                    isCompleted: false,
                    type: 'READ_CHAPTER'
                },
                {
                    id: '3',
                    title: 'Read for 30 Minutes',
                    description: 'Spend 30 minutes reading',
                    xpReward: 30,
                    progress: 0, // Mocked for now
                    target: 30,
                    isCompleted: false,
                    type: 'READING_TIME'
                }
            ];
        } catch (error) {
            this.logger.error(`Failed to get daily goals for user ${query.userId}`, error);
            throw error;
        }
    }
}
