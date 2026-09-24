import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { TokenRotationPort } from '@/application/ports/token-rotation.port';
import { LogoutCommand } from './logout.command';

@Injectable()
export class LogoutUseCase {
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
