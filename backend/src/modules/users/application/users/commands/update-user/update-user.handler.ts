import { UpdateUserCommand } from './update-user.command';
import { CommandHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const userId = UserId.create(command.id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    if (command.username && command.username !== user.username) {
      const exists = await this.userRepository.existsByUsername(
        command.username,
        userId,
      );
      if (exists) {
        throw new ConflictDomainException('Username already exists');
      }
    }

    user.updateProfile({
      username: command.username,
      bio: command.bio,
      location: command.location,
      website: command.website,
      image: command.image,
    });

    await this.userRepository.save(user);

    return user;
  }
}
