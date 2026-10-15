import { Test } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForgotPasswordCommand } from '@/modules/auth/application/auth/commands/forgot-password/forgot-password.command';
import { ForgotPasswordHandler } from '@/modules/auth/application/auth/commands/forgot-password/forgot-password.handler';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { AbilityFactory } from '@/shared/casl/ability.factory';

describe('ForgotPasswordHandler', () => {
  const actor = new AbilityFactory([]).createActor({
    userId: 'test-user',
    roles: [],
  });

  it('returns the same recovery response for an unknown email without sending mail', async () => {
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    const commandBus = {
      execute: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ForgotPasswordHandler,
        { provide: IUserRepository, useValue: userRepository },
        { provide: CommandBus, useValue: commandBus },
      ],
    }).compile();
    const handler = moduleRef.get(ForgotPasswordHandler);

    await expect(
      handler.execute(new ForgotPasswordCommand(actor, 'unknown@example.com')),
    ).resolves.toBe(
      'If an account supports password recovery, an OTP will be sent.',
    );
    expect(commandBus.execute).not.toHaveBeenCalled();

    await moduleRef.close();
  });
});
