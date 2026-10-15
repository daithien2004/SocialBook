import { DeleteUserCommand } from './delete-user.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly userRepository: IUserRepository) {}

  @Transactional()
  async execute(command: DeleteUserCommand): Promise<void> {
    const userId = UserId.create(command.id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'manage',
      subject('User', { id: user.id.toString() }),
    );

    await this.userRepository.delete(userId);
  }
}
