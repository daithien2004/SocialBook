export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export abstract class IMailerPort {
  abstract sendMail(options: SendMailOptions): Promise<void>;
}
