import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IOtpRepository } from '../../domain/repositories/otp.repository.interface';
import { Otp } from '../../domain/entities/otp.entity';

@Injectable()
export class SendOtpUseCase {
    private readonly OTP_EXPIRY_MINUTES = 5;
    private readonly logger = new Logger(SendOtpUseCase.name);

    constructor(
        private readonly otpRepository: IOtpRepository,
        private readonly mailerService: MailerService,
    ) {}

    async execute(email: string): Promise<string> {
        // 1. Check Rate Limit
        await this.otpRepository.checkRateLimit(email);

        // 2. Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiredAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
        
        const otp = new Otp(email, otpCode, expiredAt);

        // 3. Save OTP
        try {
            await this.otpRepository.save(otp);
        } catch (error) {
            this.logger.error(`Error saving OTP for ${email}: ${error.message}`);
            throw new InternalServerErrorException('Failed to save OTP');
        }

        // 4. Send Email
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Your OTP Code',
                context: {
                    otp: otpCode,
                    expiryMinutes: this.OTP_EXPIRY_MINUTES,
                },
                html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Your OTP Code</h2>
                  <p>Your verification code is:</p>
                  <h1 style="color: #4CAF50; letter-spacing: 5px;">${otpCode}</h1>
                  <p>This code will expire in ${this.OTP_EXPIRY_MINUTES} minutes.</p>
                  <p>If you didn't request this code, please ignore this email.</p>
                </div>
              `,
            });
        } catch (error) {
             this.logger.error(`Error sending email to ${email}: ${error.message}`);
             throw new InternalServerErrorException('Failed to send OTP email');
        }

        return otpCode;
    }
}
