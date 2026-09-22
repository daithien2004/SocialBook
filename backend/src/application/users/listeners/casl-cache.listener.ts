import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';

@Injectable()
export class CaslCacheListener {
  private readonly logger = new Logger(CaslCacheListener.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  @OnEvent('user.role.changed', { async: true })
  async handleUserRoleChangedEvent(event: UserRoleChangedEvent) {
    try {
      this.logger.debug(
        `Clearing CASL permissions cache for user: ${event.userId}`,
      );
      // Ensure this key matches the pattern used when setting CASL permissions in Redis
      const cacheKey = `permissions:${event.userId}`;
      await this.redis.del(cacheKey);

      this.logger.log(`Permissions cache cleared for user ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to clear CASL cache for user ${event.userId}`,
        error,
      );
    }
  }
}
