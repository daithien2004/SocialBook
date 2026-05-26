import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { IMailerPort, SendMailOptions } from '@/domain/otp/interfaces/mailer.port';

@Injectable()
export class MailerAdapter extends IMailerPort {
  constructor(private readonly nestMailer: NestMailerService) {
    super();
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.nestMailer.sendMail(options);
  }
}
