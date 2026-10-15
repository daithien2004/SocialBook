import { ResendOtpCommand } from './resend-otp.command';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { SendOtpCommand } from '@/modules/auth/application/otp/commands/send-otp/send-otp.command';
import { IOtpRepository } from '@/modules/auth/domain/auth/otp/repositories/otp.repository.interface';

@CommandHandler(ResendOtpCommand)
export class ResendOtpHandler implements ICommandHandler<ResendOtpCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly otpRepository: IOtpRepository,
  ) {}

  async execute(
    command: ResendOtpCommand,
  ): Promise<{ resendCooldown: number }> {
    const { email } = command;
    const ttl = await this.otpRepository.getTtl(email);

    if (ttl === -2) {
      // Not found, generate new
      const sendOtpCommand = new SendOtpCommand(command.actor, email);
      await this.commandBus.execute(sendOtpCommand);
      return { resendCooldown: 60 };
    }

    const RESEND_COOLDOWN = 60;
    if (ttl > 300 - RESEND_COOLDOWN) {
      const waitTime = ttl - (300 - RESEND_COOLDOWN);
      throw new BadRequestDomainException(
        `Vui lòng đợi ${waitTime} giây trước khi gửi lại OTP`,
      );
    }

    const sendOtpCommand = new SendOtpCommand(command.actor, email);
    await this.commandBus.execute(sendOtpCommand);

    return {
      resendCooldown: RESEND_COOLDOWN,
    };
  }
}
