import { Module } from '@nestjs/common';
import { IMailerPort } from '@/domain/auth/otp/interfaces/mailer.interface';
import { MailerAdapter } from './mailer.adapter';

@Module({
  providers: [
    {
      provide: IMailerPort,
      useClass: MailerAdapter,
    },
  ],
  exports: [IMailerPort],
})
export class EmailModule {}
