import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { UpdateUserImageCommand } from './update-user-image.command';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpdateUserImageCommand)
export class UpdateUserImageHandler implements ICommandHandler<
  UpdateUserImageCommand,
  { url: string }
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly mediaService: IMediaPort,
  ) {}

  async execute(command: UpdateUserImageCommand): Promise<{ url: string }> {
    if (!command.file) {
      throw new BadRequestDomainException('File is required');
    }

    const userId = UserId.create(command.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('User', { id: user.id.toString() }),
    );

    const url = await this.mediaService.uploadImage(command.file);
    await this.persistUserImage(user, url);

    return { url };
  }

  @Transactional()
  private async persistUserImage(user: User, url: string): Promise<void> {
    user.updateProfile({ image: url });
    await this.userRepository.save(user);
  }
}
