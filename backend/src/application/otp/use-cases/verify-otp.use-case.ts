import { getErrorMessage } from '@/common/utils/error.util';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestDomainException,
  InternalServerDomainException,
} from '@/shared/domain/common-exceptions';
import { IOtpRepository } from '@/domain/otp/repositories/otp.repository.interface';
import { VerifyOtpCommand } from './verify-otp.command';

@Injectable()
export class VerifyOtpUseCase {
  private readonly logger = new Logger(VerifyOtpUseCase.name);

  constructor(private readonly otpRepository: IOtpRepository) {}

  async execute(command: VerifyOtpCommand): Promise<boolean> {
    const { email, otp: inputOtp } = command;

    try {
      const otp = await this.otpRepository.findByEmail(email);

      if (!otp) {
        throw new BadRequestDomainException('OTP not found or expired');
      }

      if (otp.code !== inputOtp) {
        throw new BadRequestDomainException('Invalid OTP');
      }

      // If valid, delete the OTP to prevent reuse and clear rate limit
      await this.otpRepository.deleteByEmail(email);

      return true;
    } catch (error: unknown) {
      if (error instanceof BadRequestDomainException) throw error;
      const errMessage = getErrorMessage(error);
      this.logger.error(`Error verifying OTP for ${email}: ${errMessage}`);
      throw new InternalServerDomainException('Failed to verify OTP');
    }
  }
}
