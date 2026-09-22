import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { getAuthUserCacheKey } from '@/shared/domain/auth-cache.keys';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';

@Injectable()
export class CaslCacheListener {
  private readonly logger = new Logger(CaslCacheListener.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  @OnEvent('user.role.changed', { async: true })
  async handleUserRoleChangedEvent(event: UserRoleChangedEvent) {
    try {
      this.logger.debug(`Clearing authz caches for user: ${event.userId}`);
      // Xoá cache role/ban mà JwtStrategy.validate đọc (auth:user:{id})
      // và cache permissions CASL (permissions:{id}) để role mới có hiệu lực sớm.
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
    }
  }
}
