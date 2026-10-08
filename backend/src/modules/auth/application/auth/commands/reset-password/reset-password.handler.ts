import { ResetPasswordCommand } from './reset-password.command';
import { CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserEmail } from '@/modules/users/domain/public-api';
import { VerifyOtpHandler } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.handler';
import { VerifyOtpCommand } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.command';

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
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const isSamePassword = await this.passwordHasher.compare(
      command.newPassword,
      user.password!,
    );
    if (isSamePassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    try {
      const verifyCommand = new VerifyOtpCommand(command.email, command.otp);
      const isValid = await this.verifyOtpUseCase.execute(verifyCommand);
      if (!isValid) {
        throw new BadRequestException('Mã OTP không hợp lệ');
      }
    } catch {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const hashPassword = await this.passwordHasher.hash(command.newPassword);
    user.updatePassword(hashPassword);
    await this.userRepository.save(user);

    return 'Đặt lại mật khẩu thành công';
  }
}
