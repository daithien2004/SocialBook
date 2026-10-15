import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { ForbiddenError } from '@casl/ability';
import { randomUUID } from 'node:crypto';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { UserRoleChangeOutboxPort } from '../../user-role-change-outbox.port';
import { ToggleBanCommand } from './toggle-ban.command';

@CommandHandler(ToggleBanCommand)
export class ToggleBanHandler implements ICommandHandler<ToggleBanCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly outbox: UserRoleChangeOutboxPort,
  ) {}

  @Transactional()
  async execute(command: ToggleBanCommand): Promise<User> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan('manage', 'User');
    const userId = UserId.create(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundDomainException('User not found');
    if (user.isBanned) user.unban();
    else user.ban();
    await this.userRepository.save(user);
    await this.outbox.append({
      id: randomUUID(),
      userId: command.userId,
      roleId: user.roleId,
    });
    return user;
  }
}
