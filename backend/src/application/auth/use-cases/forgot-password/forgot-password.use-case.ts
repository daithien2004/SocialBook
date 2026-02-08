
import { Injectable, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { SendOtpUseCase } from '@/application/otp/use-cases/send-otp.use-case';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sendOtpUseCase: SendOtpUseCase,
  ) {}

  async execute(email: string): Promise<string> {
    const emailVO = UserEmail.create(email);
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (!existingUser) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    if (!existingUser.password) {
      throw new BadRequestException(
        'Tài khoản này đăng nhập bằng bên thứ ba nên không thể đổi mật khẩu'
      );
    }
    return this.sendOtpUseCase.execute(email);
  }
}
