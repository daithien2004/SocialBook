import { Injectable, BadRequestException } from '@nestjs/common';
import { SendOtpUseCase } from '@/application/otp/use-cases/send-otp.use-case';
import { SendOtpCommand } from '@/application/otp/use-cases/send-otp.command';
import { IOtpRepository } from '@/domain/otp/repositories/otp.repository.interface';
import { ResendOtpCommand } from './resend-otp.command';

@Injectable()
export class ResendOtpUseCase {
  constructor(
    private readonly sendOtpUseCase: SendOtpUseCase,
    private readonly otpRepository: IOtpRepository,
  ) { }

  async execute(command: ResendOtpCommand): Promise<{ resendCooldown: number }> {
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
