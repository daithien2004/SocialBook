
import { Injectable, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { VerifyOtpUseCase as VerifyOtpTokenUseCase } from '@/application/otp/use-cases/verify-otp.use-case';

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verifyOtpTokenUseCase: VerifyOtpTokenUseCase,
  ) {}

  async execute(email: string, otp: string): Promise<string> {
    const isValid = await this.verifyOtpTokenUseCase.execute(email, otp);
    if (!isValid) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    const emailVO = UserEmail.create(email);
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    user.verify();
    await this.userRepository.save(user);

    return 'Đăng ký thành công';
  }
}
