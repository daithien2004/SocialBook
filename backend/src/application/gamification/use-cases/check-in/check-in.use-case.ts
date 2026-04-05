import { Injectable, Logger } from '@nestjs/common';
import { IUserGamificationRepository } from '@/domain/gamification/repositories/user-gamification.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { UserGamification } from '@/domain/gamification/entities/user-gamification.entity';
import { UserGamificationId } from '@/domain/gamification/value-objects/user-gamification-id.vo';
import { UserId } from '@/domain/gamification/value-objects/user-id.vo';
import { CheckInCommand } from './check-in.command';

@Injectable()
export class CheckInUseCase {
  private readonly logger = new Logger(CheckInUseCase.name);
  private readonly CHECK_IN_XP = 10; // 10 XP for daily check-in

  constructor(
    private readonly userGamificationRepository: IUserGamificationRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: CheckInCommand): Promise<UserGamification> {
    try {
      const userId = UserId.create(command.userId);

      // Find or create user gamification
      let gamification =
        await this.userGamificationRepository.findByUser(userId);

      if (!gamification) {
        gamification = UserGamification.create({
          id: UserGamificationId.create(this.idGenerator.generate()),
          userId: command.userId,
        });
      }

      // Record check-in to update streak
      gamification.recordReading();

      // Add XP for check-in
      gamification.addXP(this.CHECK_IN_XP);

      // Save to repository
      await this.userGamificationRepository.save(gamification);

      this.logger.log(
        `Check-in recorded for user ${command.userId}, XP awarded: ${this.CHECK_IN_XP}`,
      );

      return gamification;
    } catch (error) {
      this.logger.error(
        `Failed to record check-in for user ${command.userId}`,
        error,
      );
      throw error;
    }
  }
}
