import { CommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { UserRoleChangeOutboxPort } from '../../user-role-change-outbox.port';
import { ToggleBanCommand } from './toggle-ban.command';

@CommandHandler(ToggleBanCommand)
export class ToggleBanHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly outbox: UserRoleChangeOutboxPort,
  ) {}

  async execute(command: ToggleBanCommand): Promise<User> {
    const userId = UserId.create(command.userId);
    return this.unitOfWork.execute(async () => {
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
    });
  }
}
