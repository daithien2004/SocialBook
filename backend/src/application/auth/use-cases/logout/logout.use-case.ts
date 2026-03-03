import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { LogoutCommand } from './logout.command';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    const id = UserId.create(command.userId);
    const user = await this.userRepository.findById(id);
    if (user) {
      user.updateHashedRt(null);
      await this.userRepository.save(user);
    }
    return { message: 'Đăng xuất thành công' };
  }
}
