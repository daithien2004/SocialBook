import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { SendOtpHandler } from './use-cases/send-otp.handler';
import { VerifyOtpHandler } from './use-cases/verify-otp.handler';
import { OtpRepositoryModule } from '@/infrastructure/database/repositories/otp/otp-repository.module';
import { EmailModule } from '@/infrastructure/email/email.module';

@Module({
  imports: [
    CqrsModule,OtpRepositoryModule, EmailModule],
  providers: [SendOtpHandler, VerifyOtpHandler],
  exports: [SendOtpHandler, VerifyOtpHandler],
})
export class OtpApplicationModule {}
