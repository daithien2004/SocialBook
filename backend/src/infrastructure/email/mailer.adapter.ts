import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  IMailerPort,
  SendMailOptions,
} from '@/domain/otp/interfaces/mailer.port';

@Injectable()
export class MailerAdapter extends IMailerPort {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly logger = new Logger(MailerAdapter.name);

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('env.RESEND_API_KEY', '');
    this.fromEmail = this.configService.get<string>(
      'env.RESEND_FROM_EMAIL',
      'noreply@socialbook.io.vn',
    );
    this.resend = new Resend(apiKey);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      this.logger.error(`Resend error: ${JSON.stringify(error)}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
