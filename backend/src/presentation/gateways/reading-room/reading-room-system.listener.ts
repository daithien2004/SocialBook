import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { EventNames } from '@/common/constants/event-names.constant';
import { UserRoleChangedEvent } from '@/application/users/events/user-role-changed.event';
import { TOKEN_REVOCATION_TTL_SECONDS } from './reading-room.constants';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';

@Injectable()
export class ReadingRoomSystemListener {
  private readonly logger = new Logger(ReadingRoomSystemListener.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
  ) {}

  @OnEvent(EventNames.USER_ROLE_CHANGED)
  async handleUserRoleChanged(event: UserRoleChangedEvent) {
    this.logger.debug(
      `User ${event.userId} role changed, revoking tokens and forcing socket disconnect.`,
    );
    try {
      await this.redis.set(
        `auth:revoked:${event.userId}`,
        Date.now(),
        'EX',
        TOKEN_REVOCATION_TTL_SECONDS,
      );
    } catch (e: unknown) {
      this.logger.error('Failed to set token revocation timestamp', e);
    }

    try {
      this.namespaceProvider
        .getServer()
        .in(`user:${event.userId}`)
        .disconnectSockets(true);
    } catch {
      // server is not initialized yet
    }
  }
}
