import { VerifyOtpCommand } from './verify-otp.command';
import { VerifyOtpCommand as VerifyOtpTokenCommand } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.command';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserEmail } from '@/modules/users/domain/public-api';

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpHandler implements ICommandHandler<VerifyOtpCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<string> {
    const verifyTokenCommand = new VerifyOtpTokenCommand(
      command.actor,
      command.email,
      command.otp,
    );
    const isValid = await this.commandBus.execute(verifyTokenCommand);
    if (!isValid) {
      throw new BadRequestDomainException('Mã OTP không hợp lệ');
    }

    const emailVO = UserEmail.create(command.email);
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new NotFoundDomainException('Người dùng không tồn tại');
    }

    user.verify();
    await this.userRepository.save(user);

    return 'Đăng ký thành công';
  }
}
