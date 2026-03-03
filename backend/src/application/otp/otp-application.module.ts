import { Module } from '@nestjs/common';
import { SendOtpUseCase } from './use-cases/send-otp.use-case';
import { VerifyOtpUseCase } from './use-cases/verify-otp.use-case';
import { OtpRepositoryModule } from '@/infrastructure/database/repositories/otp/otp-repository.module';

@Module({
  imports: [OtpRepositoryModule],
  providers: [SendOtpUseCase, VerifyOtpUseCase],
  exports: [SendOtpUseCase, VerifyOtpUseCase],
})
export class OtpApplicationModule {}
