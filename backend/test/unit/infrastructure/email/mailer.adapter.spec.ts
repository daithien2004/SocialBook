import { ConfigService } from '@nestjs/config';
import { MailerAdapter } from '@/infrastructure/email/mailer.adapter';

jest.mock('resend', () => {
  const send = jest.fn();
  return {
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
    __send: send,
  };
});

const resendMock: { Resend: jest.Mock; __send: jest.Mock } =
  jest.requireMock('resend');

function createConfigService(
  apiKey: string,
  nodeEnv = 'development',
): jest.Mocked<ConfigService> {
  return {
    get: jest.fn().mockImplementation((key: string, fallback?: string) => {
      if (key === 'env.RESEND_API_KEY') return apiKey;
      if (key === 'env.RESEND_FROM_EMAIL') {
        return fallback ?? 'noreply@socialbook.io.vn';
      }
      if (key === 'env.NODE_ENV') return nodeEnv;
      return fallback;
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

describe('MailerAdapter', () => {
  beforeEach(() => {
    resendMock.Resend.mockClear();
    resendMock.__send.mockClear();
  });

  it('dev mode + thiếu RESEND_API_KEY -> log console, không gọi Resend', async () => {
    const adapter = new MailerAdapter(createConfigService(''));

    await adapter.sendMail({
      to: 'dev@example.com',
      subject: 'Your OTP Code',
      html: '<h1>123456</h1>',
    });

    expect(resendMock.__send).not.toHaveBeenCalled();
  });

  it('production + thiếu RESEND_API_KEY -> vẫn gọi Resend (fail-closed)', async () => {
    const adapter = new MailerAdapter(createConfigService('', 'production'));
    resendMock.__send.mockResolvedValue({
      error: { message: 'Missing API key' },
    });

    await expect(
      adapter.sendMail({
        to: 'prod@example.com',
        subject: 'Your OTP Code',
        html: '123456',
      }),
    ).rejects.toThrow('Failed to send email');
  });

  it('dev mode + có RESEND_API_KEY -> gọi Resend thật', async () => {
    const adapter = new MailerAdapter(createConfigService('re_key'));
    resendMock.__send.mockResolvedValue({ error: null });

    await adapter.sendMail({
      to: 'dev@example.com',
      subject: 'Your OTP Code',
      html: '123456',
    });

    expect(resendMock.__send).toHaveBeenCalledWith({
      from: 'noreply@socialbook.io.vn',
      to: 'dev@example.com',
      subject: 'Your OTP Code',
      html: '123456',
    });
  });
});
