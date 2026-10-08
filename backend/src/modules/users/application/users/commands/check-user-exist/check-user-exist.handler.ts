import { CheckUserExistCommand } from './check-user-exist.command';
import { CommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { UserEmail } from '@/modules/users/domain/users/value-objects/user-email.vo';
import { CheckUserExistQuery } from './check-user-exist.query';

@CommandHandler(CheckUserExistCommand)
export class CheckUserExistHandler {
  private readonly logger = new Logger(CheckUserExistHandler.name);

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: CheckUserExistQuery): Promise<boolean> {
    try {
      if (query.id) {
        const userId = UserId.create(query.id);
        const user = await this.userRepository.findById(userId);
        return !!user;
      }

      if (query.email) {
        const user = await this.userRepository.findByEmail(
          UserEmail.create(query.email),
        );
        return !!user;
      }

      if (query.username) {
        const user = await this.userRepository.findByUsername(query.username);
        return !!user;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check user existence', error);
      return false;
    }
  }
}
