import { CheckUserLocationsCommand } from './check-user-locations.command';
import { CommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';

export interface UserLocationSummary {
  totalUsers: number;
  usersWithLocation: number;
  sampleUsers: Array<{ username: string; location: string }>;
}

@CommandHandler(CheckUserLocationsCommand)
export class CheckUserLocationsHandler {
  private readonly logger = new Logger(CheckUserLocationsHandler.name);

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserLocationSummary> {
    try {
      this.logger.log('Checking user locations');

      const totalUsers = await this.userRepository.countAll();
      const usersWithLocation = await this.userRepository.countWithLocation();
      const sampleUsers =
        await this.userRepository.findSampleUsersWithLocation(5);

      return {
        totalUsers,
        usersWithLocation,
        sampleUsers,
      };
    } catch (error) {
      this.logger.error('Failed to check user locations', error);
      throw error;
    }
  }
}
