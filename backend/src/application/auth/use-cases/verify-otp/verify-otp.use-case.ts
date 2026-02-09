import { Injectable, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { VerifyOtpUseCase as VerifyOtpTokenUseCase } from '@/application/otp/use-cases/verify-otp.use-case';
import { VerifyOtpCommand as VerifyOtpTokenCommand } from '@/application/otp/use-cases/verify-otp.command';
import { VerifyOtpCommand } from './verify-otp.command';

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verifyOtpTokenUseCase: VerifyOtpTokenUseCase,
  ) { }

  async execute(command: VerifyOtpCommand): Promise<string> {
    const verifyTokenCommand = new VerifyOtpTokenCommand(command.email, command.otp);
    const isValid = await this.verifyOtpTokenUseCase.execute(verifyTokenCommand);
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
