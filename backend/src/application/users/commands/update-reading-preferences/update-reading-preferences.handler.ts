import { UpdateReadingPreferencesCommand } from './update-reading-preferences.command';
import { CommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { User } from '@/domain/users/entities/user.entity';

@CommandHandler(UpdateReadingPreferencesCommand)
export class UpdateReadingPreferencesHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(command: UpdateReadingPreferencesCommand): Promise<User> {
    const userId = UserId.create(command.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    const { ...preferences } = command;
    user.updateReadingPreferences(preferences);
    await this.userRepository.save(user);

    return user;
  }
}
