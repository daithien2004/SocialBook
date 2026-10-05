import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { SendOtpHandler } from './commands/send-otp/send-otp.handler';
import { VerifyOtpHandler } from './commands/verify-otp/verify-otp.handler';
import { OtpRepositoryModule } from '@/infrastructure/database/repositories/otp/otp-repository.module';
import { EmailModule } from '@/infrastructure/email/email.module';

@Module({
  imports: [
    CqrsModule,OtpRepositoryModule, EmailModule],
  providers: [SendOtpHandler, VerifyOtpHandler],
  exports: [SendOtpHandler, VerifyOtpHandler],
})
export class OtpApplicationModule {}
