import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  IMailerPort,
  SendMailOptions,
} from '@/domain/auth/otp/interfaces/mailer.port';

@Injectable()
export class MailerAdapter implements IMailerPort {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly devLogMail: boolean;
  private readonly logger = new Logger(MailerAdapter.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('env.RESEND_API_KEY', '');
    this.fromEmail = this.configService.get<string>(
      'env.RESEND_FROM_EMAIL',
      'noreply@socialbook.io.vn',
    );
    this.devLogMail =
      this.configService.get<string>('env.NODE_ENV', 'development') !==
        'production' && !apiKey;
    this.resend = new Resend(apiKey || 're_dummy_key_to_bypass_constructor');
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (this.devLogMail) {
      this.logger.log(
        `[DEV MAILER] To: ${options.to} | Subject: ${options.subject}\n${options.html}`,
      );
      return;
    }

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
