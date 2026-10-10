import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { getAuthUserCacheKey } from '@/shared/platform/cache/auth-cache.keys';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { EventNames } from '@/shared/platform/constants/event-names.constant';

@Injectable()
export class CaslCacheListener {
  private readonly logger = new Logger(CaslCacheListener.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  @OnEvent(EventNames.USER_ROLE_CHANGED, {
    async: true,
    suppressErrors: false,
  })
  async handleUserRoleChangedEvent(event: UserRoleChangedEvent) {
    try {
      this.logger.debug(`Clearing authz caches for user: ${event.userId}`);
      // XoÃ¡ cache role/ban mÃ  JwtStrategy.validate Ä‘á»c (auth:user:{id})
      // vÃ  cache permissions CASL (permissions:{id}) Ä‘á»ƒ role má»›i cÃ³ hiá»‡u lá»±c sá»›m.
      await Promise.all([
        this.redis.del(getAuthUserCacheKey(event.userId)),
        this.redis.del(`permissions:${event.userId}`),
      ]);

      this.logger.log(`Authz caches cleared for user ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to clear authz caches for user ${event.userId}`,
        error,
      );
      throw error;
    }
  }
}
