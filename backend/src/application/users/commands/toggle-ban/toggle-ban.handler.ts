import { ToggleBanCommand } from './toggle-ban.command';
import { CommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { User } from '@/domain/users/entities/user.entity';
import { UserRoleChangedEvent } from '../../events/user-role-changed.event';
import { EventNames } from '@/common/constants/event-names.constant';

@CommandHandler(ToggleBanCommand)
export class ToggleBanHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ToggleBanCommand): Promise<User> {
    const userId = UserId.create(command.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    if (user.isBanned) {
      user.unban();
    } else {
      user.ban();
    }

    await this.userRepository.save(user);

    // Đổi trạng thái authz → listener xoá cache role/ban + CASL + (tương lai) tăng version.
    this.eventEmitter.emit(
      EventNames.USER_ROLE_CHANGED,
      new UserRoleChangedEvent(command.userId, user.roleId),
    );

    return user;
  }
}
