import { VerifyOtpCommand } from './verify-otp.command';
import { VerifyOtpCommand as VerifyOtpTokenCommand } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.command';
import { CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserEmail } from '@/modules/users/domain/public-api';
import { VerifyOtpHandler as VerifyOtpTokenUseCase } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.handler';

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verifyOtpTokenUseCase: VerifyOtpTokenUseCase,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<string> {
    const verifyTokenCommand = new VerifyOtpTokenCommand(
      command.email,
      command.otp,
    );
    const isValid =
      await this.verifyOtpTokenUseCase.execute(verifyTokenCommand);
    if (!isValid) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    const emailVO = UserEmail.create(command.email);
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    user.verify();
    await this.userRepository.save(user);

    return 'Đăng ký thành công';
  }
}
