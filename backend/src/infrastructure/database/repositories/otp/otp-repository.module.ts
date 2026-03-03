import { Module } from '@nestjs/common';
import { IOtpRepository } from '@/domain/otp/repositories/otp.repository.interface';
import { OtpRepository } from './otp.repository';

@Module({
  providers: [
    {
      provide: IOtpRepository,
      useClass: OtpRepository,
    },
  ],
  exports: [IOtpRepository],
})
export class OtpRepositoryModule {}
