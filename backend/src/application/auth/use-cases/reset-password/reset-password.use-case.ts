import { Injectable, BadRequestException } from '@nestjs/common';
import type { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { Inject } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { VerifyOtpUseCase } from '@/application/otp/use-cases/verify-otp.use-case';
import { VerifyOtpCommand } from '@/application/otp/use-cases/verify-otp.command';
import { ResetPasswordCommand } from './reset-password.command';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    @Inject('IPasswordHasher') private readonly passwordHasher: IPasswordHasher,
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
    } catch (e) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const hashPassword = await this.passwordHasher.hash(command.newPassword);
    user.updatePassword(hashPassword);
    await this.userRepository.save(user);

    return 'Đặt lại mật khẩu thành công';
  }
}
