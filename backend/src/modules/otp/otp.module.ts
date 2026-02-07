import { Module } from '@nestjs/common';
import { SendOtpUseCase } from './application/use-cases/send-otp.use-case';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp.use-case';
import { OtpRepository } from './infrastructure/repositories/otp.repository';
import { IOtpRepository } from './domain/repositories/otp.repository.interface';

@Module({
  providers: [
    SendOtpUseCase,
    VerifyOtpUseCase,
    {
      provide: IOtpRepository,
      useClass: OtpRepository,
    },
  ],
  exports: [SendOtpUseCase, VerifyOtpUseCase, IOtpRepository],
})
export class OtpModule {}
