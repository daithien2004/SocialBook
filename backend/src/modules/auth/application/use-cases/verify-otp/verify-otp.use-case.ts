
import { Injectable, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/src/modules/users/domain/repositories/user.repository.interface';
import { UserEmail } from '@/src/modules/users/domain/value-objects/user-email.vo';
// Alias to avoid conflict if class names are same, or import from full path
import { VerifyOtpUseCase as VerifyOtpTokenUseCase } from '@/src/modules/otp/application/use-cases/verify-otp.use-case';

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
