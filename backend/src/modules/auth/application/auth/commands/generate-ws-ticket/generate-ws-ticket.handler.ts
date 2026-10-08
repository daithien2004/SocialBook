import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { randomBytes, createHash } from 'crypto';
import { GenerateWsTicketCommand } from './generate-ws-ticket.command';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserId } from '@/modules/users/domain/public-api';

const WS_TICKET_TTL_SEC = 30;

@CommandHandler(GenerateWsTicketCommand)
export class GenerateWsTicketHandler implements ICommandHandler<GenerateWsTicketCommand> {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: GenerateWsTicketCommand): Promise<string> {
    const user = await this.userRepository.findById(
      UserId.create(command.userId),
    );
    if (!user) {
      throw new Error('User not found');
    }

    const ticket = randomBytes(32).toString('base64url');
    const hash = createHash('sha256').update(ticket).digest('hex');

    await this.redis.set(
      `wsticket:${hash}`,
      JSON.stringify({
        userId: command.userId,
        role: command.role,
        displayName: user.username,
        avatarUrl: user.image,
      }),
      'EX',
      WS_TICKET_TTL_SEC,
    );

    return ticket;
  }
}
