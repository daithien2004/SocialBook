import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { IOtpRepository } from '@/domain/otp/repositories/otp.repository.interface';
import { VerifyOtpCommand } from './verify-otp.command';

@Injectable()
export class VerifyOtpUseCase {
    private readonly logger = new Logger(VerifyOtpUseCase.name);

    constructor(
        private readonly otpRepository: IOtpRepository,
    ) { }

    async execute(command: VerifyOtpCommand): Promise<boolean> {
        const { email, otp: inputOtp } = command;

        try {
            const otp = await this.otpRepository.findByEmail(email);

            if (!otp) {
                throw new BadRequestException('OTP not found or expired');
            }

            if (otp.code !== inputOtp) {
                throw new BadRequestException('Invalid OTP');
            }

            // If valid, delete the OTP to prevent reuse and clear rate limit
            await this.otpRepository.deleteByEmail(email);

            return true;
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(`Error verifying OTP for ${email}: ${error.message}`);
            throw new InternalServerErrorException('Failed to verify OTP');
        }
    }
}
