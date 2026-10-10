import { Test } from '@nestjs/testing';
import { ForgotPasswordCommand } from '@/modules/auth/application/auth/commands/forgot-password/forgot-password.command';
import { ForgotPasswordHandler } from '@/modules/auth/application/auth/commands/forgot-password/forgot-password.handler';
import { SendOtpHandler } from '@/modules/auth/application/otp/commands/send-otp/send-otp.handler';
import { IUserRepository } from '@/modules/users/domain/public-api';

describe('ForgotPasswordHandler', () => {
  it('returns the same recovery response for an unknown email without sending mail', async () => {
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    const sendOtpHandler = {
      execute: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ForgotPasswordHandler,
        { provide: IUserRepository, useValue: userRepository },
        { provide: SendOtpHandler, useValue: sendOtpHandler },
      ],
    }).compile();
    const handler = moduleRef.get(ForgotPasswordHandler);

    await expect(
      handler.execute(new ForgotPasswordCommand('unknown@example.com')),
    ).resolves.toBe(
      'If an account supports password recovery, an OTP will be sent.',
    );
    expect(sendOtpHandler.execute).not.toHaveBeenCalled();

    await moduleRef.close();
  });
});
