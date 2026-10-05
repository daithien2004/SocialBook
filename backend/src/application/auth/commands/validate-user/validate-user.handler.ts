import { ValidateUserCommand } from './validate-user.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserBannedDomainException } from '@/domain/auth/exceptions/auth-exceptions';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { User } from '@/domain/users/entities/user.entity';

@CommandHandler(ValidateUserCommand)
export class ValidateUserHandler implements ICommandHandler<
  ValidateUserCommand,
  User | null
> {
  constructor(
    private readonly userRepository: IUserRepository,
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
