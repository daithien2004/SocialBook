import { Injectable, BadRequestException } from '@nestjs/common';
import { SendOtpUseCase } from '@/src/modules/otp/application/use-cases/send-otp.use-case';
import { IOtpRepository } from '@/src/modules/otp/domain/repositories/otp.repository.interface';

@Injectable()
export class ResendOtpUseCase {
  constructor(
    private readonly sendOtpUseCase: SendOtpUseCase,
    private readonly otpRepository: IOtpRepository,
  ) {}

  async execute(email: string): Promise<{ resendCooldown: number }> {
    const ttl = await this.otpRepository.getTtl(email);

    if (ttl === -2) {
       // Not found, generate new
       await this.sendOtpUseCase.execute(email);
       return { resendCooldown: 60 };
    }

    const RESEND_COOLDOWN = 60;
    if (ttl > 300 - RESEND_COOLDOWN) {
      const waitTime = ttl - (300 - RESEND_COOLDOWN);
      throw new BadRequestException(
        `Vui lòng đợi ${waitTime} giây trước khi gửi lại OTP`,
      );
    }

    await this.sendOtpUseCase.execute(email);

    return {
      resendCooldown: RESEND_COOLDOWN,
    };
  }
}
