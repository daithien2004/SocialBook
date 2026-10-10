import { SendOtpCommand } from '@/modules/auth/application/otp/commands/send-otp/send-otp.command';
import { SendOtpHandler } from '@/modules/auth/application/otp/commands/send-otp/send-otp.handler';
import { Otp } from '@/modules/auth/domain/auth/otp/entities/otp.entity';
import {
  IMailerPort,
  SendMailOptions,
} from '@/modules/auth/domain/auth/otp/interfaces/mailer.port';
import { IOtpRepository } from '@/modules/auth/domain/auth/otp/repositories/otp.repository.interface';

class CapturingOtpRepository extends IOtpRepository {
  savedOtp: Otp | undefined;

  save(otp: Otp): Promise<void> {
    this.savedOtp = otp;
    return Promise.resolve();
  }

  findByEmail(): Promise<Otp | null> {
    return Promise.resolve(this.savedOtp ?? null);
  }

  deleteByEmail(): Promise<void> {
    return Promise.resolve();
  }

  checkRateLimit(): Promise<void> {
    return Promise.resolve();
  }

  getTtl(): Promise<number> {
    return Promise.resolve(0);
  }

  incrementVerifyAttempts(): Promise<number> {
    return Promise.resolve(0);
  }

  clearVerifyAttempts(): Promise<void> {
    return Promise.resolve();
  }
}

class CapturingMailer extends IMailerPort {
  sentMail: SendMailOptions | undefined;

  sendMail(options: SendMailOptions): Promise<void> {
    this.sentMail = options;
    return Promise.resolve();
  }
}

describe('SendOtpHandler', () => {
  it('stores and emails a six-digit OTP', async () => {
    const repository = new CapturingOtpRepository();
    const mailer = new CapturingMailer();
    const handler = new SendOtpHandler(repository, mailer);

    await handler.execute(new SendOtpCommand('reader@example.com'));

    expect(repository.savedOtp?.code).toMatch(/^\d{6}$/);
    expect(mailer.sentMail?.html).toContain(repository.savedOtp?.code);
  });
});
