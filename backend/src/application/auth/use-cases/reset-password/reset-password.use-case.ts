
import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { VerifyOtpUseCase } from '@/application/otp/use-cases/verify-otp.use-case';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
  ) {}

  async execute(email: string, otp: string, newPassword: string): Promise<string> {
    const emailVO = UserEmail.create(email);
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới phải khác mật khẩu hiện tại',
      );
    }

    try {
        const isValid = await this.verifyOtpUseCase.execute(email, otp);
        if (!isValid) {
            throw new BadRequestException('Mã OTP không hợp lệ');
        }
    } catch (e) {
        throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.updatePassword(hashPassword);
    await this.userRepository.save(user);

    return 'Đặt lại mật khẩu thành công';
  }
}
