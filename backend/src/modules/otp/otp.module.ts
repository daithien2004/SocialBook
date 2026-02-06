import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [MailerModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule { }
