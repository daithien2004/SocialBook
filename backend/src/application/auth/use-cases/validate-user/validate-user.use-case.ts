import { UserBannedDomainException } from '@/domain/auth/exceptions/auth-exceptions';
import { Injectable } from '@nestjs/common';
import type { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { Inject } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';

@Injectable()
export class ValidateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher') private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(email: string, pass: string): Promise<any> {
    const emailVO = UserEmail.create(email);
    const user = await this.userRepository.findByEmail(emailVO);

    if (!user) {
      return null;
    }

    const isMatch = await this.passwordHasher.compare(
      pass,
      user.password || '',
    );
    if (!isMatch) {
      return null;
    }

    if (user.isBanned) {
      throw new UserBannedDomainException(
        'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
      );
    }

    const { password, ...result } = user;
    return user;
  }
}
