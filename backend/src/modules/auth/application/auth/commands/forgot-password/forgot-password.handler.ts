import { ForgotPasswordCommand } from './forgot-password.command';
import { CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserEmail } from '@/modules/users/domain/public-api';
import { SendOtpHandler } from '@/modules/auth/application/otp/commands/send-otp/send-otp.handler';
import { SendOtpCommand } from '@/modules/auth/application/otp/commands/send-otp/send-otp.command';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sendOtpUseCase: SendOtpHandler,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<string> {
    const emailVO = UserEmail.create(command.email);
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (!existingUser) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    if (!existingUser.password) {
      throw new BadRequestException(
        'Tài khoản này đăng nhập bằng bên thứ ba nên không thể đổi mật khẩu',
      );
    }

    const sendOtpCommand = new SendOtpCommand(command.email);
    return this.sendOtpUseCase.execute(sendOtpCommand);
  }
}
