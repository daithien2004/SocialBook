import { Test } from '@nestjs/testing';
import { GenerateWsTicketCommand } from '@/modules/auth/application/auth/commands/generate-ws-ticket/generate-ws-ticket.command';
import { GenerateWsTicketHandler } from '@/modules/auth/application/auth/commands/generate-ws-ticket/generate-ws-ticket.handler';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

describe('GenerateWsTicketHandler', () => {
  it('returns a not-found domain error when the authenticated user no longer exists', async () => {
    const userRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        GenerateWsTicketHandler,
        { provide: IUserRepository, useValue: userRepository },
        { provide: 'default_IORedisModuleConnectionToken', useValue: {} },
      ],
    }).compile();
    const handler = moduleRef.get(GenerateWsTicketHandler);

    await expect(
      handler.execute(new GenerateWsTicketCommand('missing-user', 'user')),
    ).rejects.toBeInstanceOf(NotFoundDomainException);

    await moduleRef.close();
  });
});
