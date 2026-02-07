import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IUserGamificationRepository } from '../../../domain/repositories/user-gamification.repository.interface';
import { UserGamification } from '../../../domain/entities/user-gamification.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { RecordReadingCommand } from './record-reading.command';

@Injectable()
export class RecordReadingUseCase {
    private readonly logger = new Logger(RecordReadingUseCase.name);

    constructor(
        private readonly userGamificationRepository: IUserGamificationRepository
    ) {}

    async execute(command: RecordReadingCommand): Promise<UserGamification> {
        try {
            const userId = UserId.create(command.userId);
            
            // Find or create user gamification
            let gamification = await this.userGamificationRepository.findByUser(userId);
            
            if (!gamification) {
                gamification = UserGamification.create({ userId: command.userId });
            }

            // Record reading and update streak
            gamification.recordReading();
            
            // Add XP
            gamification.addXP(command.xpAmount);

            // Save to repository
            await this.userGamificationRepository.save(gamification);

            this.logger.log(`Reading recorded for user ${command.userId}, XP awarded: ${command.xpAmount}`);

            return gamification;
        } catch (error) {
            this.logger.error(`Failed to record reading for user ${command.userId}`, error);
            throw error;
        }
    }
}
