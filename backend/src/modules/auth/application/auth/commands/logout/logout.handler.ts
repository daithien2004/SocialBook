import { LogoutCommand } from './logout.command';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserId } from '@/modules/users/domain/public-api';
import { TokenRotationPort } from '@/modules/auth/application/public-api';

@CommandHandler(LogoutCommand)
export class LogoutHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    @Inject(TokenRotationPort)
    private readonly rotationPort: TokenRotationPort,
  ) {}

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    const id = UserId.create(command.userId);
    const user = await this.userRepository.findById(id);
    if (user) {
      user.updateHashedRt(null);
      user.updatePreviousHashedRt(null);
      user.updateRefreshRotatedAt(null);
      await this.userRepository.save(user);
    }
    await this.rotationPort.revokeAll(command.userId);
    return { message: 'Đăng xuất thành công' };
  }
}
