import { UserBannedDomainException } from '@/domain/auth/exceptions/auth-exceptions';
import { Injectable, Inject } from '@nestjs/common';
import type { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { User } from '@/domain/users/entities/user.entity';

export const PASSWORD_HASHER_TOKEN = 'IPasswordHasher';

export interface ValidateUserCommand {
  email: string;
  password: string;
}

@Injectable()
export class ValidateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: ValidateUserCommand): Promise<User | null> {
    const emailVO = UserEmail.create(command.email);
    const user = await this.userRepository.findByEmail(emailVO);

    if (!user) {
      return null;
    }

    const isMatch = await this.passwordHasher.compare(
      command.password,
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

    return user;
  }
}
