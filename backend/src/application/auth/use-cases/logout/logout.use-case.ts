
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<{ message: string }> {
    const id = UserId.create(userId);
    const user = await this.userRepository.findById(id);
    if (user) {
        user.updateHashedRt(null);
        await this.userRepository.save(user);
    }
    return { message: 'Đăng xuất thành công' };
  }
}
