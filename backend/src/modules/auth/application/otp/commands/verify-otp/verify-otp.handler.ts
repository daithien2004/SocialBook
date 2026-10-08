import { VerifyOtpCommand } from './verify-otp.command';
import { CommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { Logger } from '@nestjs/common';
import {
  BadRequestDomainException,
  InternalServerDomainException,
} from '@/shared/domain/common-exceptions';
import { IOtpRepository } from '@/modules/auth/domain/auth/otp/repositories/otp.repository.interface';

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpHandler {
  private readonly MAX_VERIFY_ATTEMPTS = 5;
  private readonly logger = new Logger(VerifyOtpHandler.name);

  constructor(private readonly otpRepository: IOtpRepository) {}

  async execute(command: VerifyOtpCommand): Promise<boolean> {
    const { email, otp: inputOtp } = command;

    try {
      const otp = await this.otpRepository.findByEmail(email);

      if (!otp) {
        throw new BadRequestDomainException('OTP not found or expired');
      }

      if (otp.code !== inputOtp) {
        const attempts =
          await this.otpRepository.incrementVerifyAttempts(email);
        if (attempts >= this.MAX_VERIFY_ATTEMPTS) {
          await this.otpRepository.deleteByEmail(email);
          await this.otpRepository.clearVerifyAttempts(email);
          throw new BadRequestDomainException(
            'Báº¡n Ä‘Ã£ nháº­p sai quÃ¡ 5 láº§n. MÃ£ OTP Ä‘Ã£ bá»‹ há»§y Ä‘á»ƒ báº£o máº­t.',
          );
        }
        throw new BadRequestDomainException('Invalid OTP');
      }

      // If valid, delete the OTP to prevent reuse and clear rate limit
      await this.otpRepository.deleteByEmail(email);
      await this.otpRepository.clearVerifyAttempts(email);

      return true;
    } catch (error: unknown) {
      if (error instanceof BadRequestDomainException) throw error;
      const errMessage = getErrorMessage(error);
      this.logger.error(`Error verifying OTP for ${email}: ${errMessage}`);
      throw new InternalServerDomainException('Failed to verify OTP');
    }
  }
}
