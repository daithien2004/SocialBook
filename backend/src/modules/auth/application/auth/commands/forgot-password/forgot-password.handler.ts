import { ForgotPasswordCommand } from './forgot-password.command';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository, UserEmail } from '@/modules/users/domain/public-api';
import { SendOtpCommand } from '@/modules/auth/application/otp/commands/send-otp/send-otp.command';

const RECOVERY_REQUEST_MESSAGE =
  'If an account supports password recovery, an OTP will be sent.';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<string> {
    const emailVO = UserEmail.create(command.email);
    const user = await this.userRepository.findByEmail(emailVO);

    if (!user?.password) {
      return RECOVERY_REQUEST_MESSAGE;
    }

    await this.commandBus.execute(
      new SendOtpCommand(command.actor, command.email),
    );
    return RECOVERY_REQUEST_MESSAGE;
  }
}
