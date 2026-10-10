import { ResetPasswordCommand } from './reset-password.command';
import { BadRequestException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository, UserEmail } from '@/modules/users/domain/public-api';
import { VerifyOtpHandler } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.handler';
import { VerifyOtpCommand } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.command';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

const INVALID_RECOVERY_DETAILS = 'Email or OTP is invalid or expired';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verifyOtpUseCase: VerifyOtpHandler,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<string> {
    const emailVO = UserEmail.create(command.email);
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user?.password) {
      throw new BadRequestException(INVALID_RECOVERY_DETAILS);
    }

    try {
      const verifyCommand = new VerifyOtpCommand(command.email, command.otp);
      const isValid = await this.verifyOtpUseCase.execute(verifyCommand);
      if (!isValid) {
        throw new BadRequestException(INVALID_RECOVERY_DETAILS);
      }
    } catch (error: unknown) {
      if (error instanceof BadRequestDomainException) {
        throw new BadRequestException(INVALID_RECOVERY_DETAILS);
      }
      throw error;
    }

    const isSamePassword = await this.passwordHasher.compare(
      command.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must differ from the current password',
      );
    }

    const hashPassword = await this.passwordHasher.hash(command.newPassword);
    user.updatePassword(hashPassword);
    await this.userRepository.save(user);

    return 'Password reset successfully';
  }
}
