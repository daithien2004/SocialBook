import { Module } from '@nestjs/common';
import { IMailerPort } from '@/domain/otp/interfaces/mailer.port';
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
