import { Module } from '@nestjs/common';
import { SendOtpUseCase } from './use-cases/send-otp.use-case';
import { VerifyOtpUseCase } from './use-cases/verify-otp.use-case';
import { OtpRepositoryModule } from '@/infrastructure/database/repositories/otp/otp-repository.module';
import { MailerAdapter } from '@/infrastructure/email/mailer.adapter';
import { IMailerPort } from '@/domain/otp/interfaces/mailer.port';

@Module({
  imports: [OtpRepositoryModule],
  providers: [
    SendOtpUseCase,
    VerifyOtpUseCase,
    { provide: IMailerPort, useClass: MailerAdapter },
  ],
  exports: [SendOtpUseCase, VerifyOtpUseCase],
})
export class OtpApplicationModule {}
