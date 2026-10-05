import { ForgotPasswordCommand } from './forgot-password.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { SendOtpHandler } from '@/application/otp/commands/send-otp/send-otp.handler';
import { SendOtpCommand } from '@/application/otp/commands/send-otp/send-otp.command';

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
