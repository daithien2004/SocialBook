import { ResendOtpCommand } from './resend-otp.command';
import { CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { SendOtpHandler } from '@/application/otp/commands/send-otp/send-otp.handler';
import { SendOtpCommand } from '@/application/otp/commands/send-otp/send-otp.command';
import { IOtpRepository } from '@/domain/auth/otp/repositories/otp.repository.interface';

@CommandHandler(ResendOtpCommand)
export class ResendOtpHandler {
  constructor(
    private readonly sendOtpUseCase: SendOtpHandler,
    private readonly otpRepository: IOtpRepository,
  ) {}

  async execute(
    command: ResendOtpCommand,
  ): Promise<{ resendCooldown: number }> {
    const { email } = command;
    const ttl = await this.otpRepository.getTtl(email);

    if (ttl === -2) {
      // Not found, generate new
      const sendOtpCommand = new SendOtpCommand(email);
      await this.sendOtpUseCase.execute(sendOtpCommand);
      return { resendCooldown: 60 };
    }

    const RESEND_COOLDOWN = 60;
    if (ttl > 300 - RESEND_COOLDOWN) {
      const waitTime = ttl - (300 - RESEND_COOLDOWN);
      throw new BadRequestException(
        `Vui lòng đợi ${waitTime} giây trước khi gửi lại OTP`,
      );
    }

    const sendOtpCommand = new SendOtpCommand(email);
    await this.sendOtpUseCase.execute(sendOtpCommand);

    return {
      resendCooldown: RESEND_COOLDOWN,
    };
  }
}
