import { UpdateUserCommand } from './update-user.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import {
  NotFoundDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly userRepository: IUserRepository) {}

  @Transactional()
  async execute(command: UpdateUserCommand): Promise<User> {
    const userId = UserId.create(command.id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('User', { id: user.id.toString() }),
    );

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
