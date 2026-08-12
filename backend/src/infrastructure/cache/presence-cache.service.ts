import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import type {
  IPresenceCache,
  PresenceData,
} from '@/domain/reading-rooms/interfaces/presence-cache.interface';

@Injectable()
export class PresenceCacheService implements IPresenceCache {
  private readonly logger = new Logger(PresenceCacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private getKey(roomId: string, userId: string): string {
    return `presence:${roomId}:${userId}`;
  }

  private getSetKey(roomId: string): string {
    return `room:members:${roomId}`;
  }

  async upsertPresence(
    roomId: string,
    userId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void> {
    const key = this.getKey(roomId, userId);
    const setKey = this.getSetKey(roomId);

    const presenceData: PresenceData = {
      ...data,
      lastSeen: Date.now(),
    };

    try {
      await Promise.all([
        this.redis.setex(key, 30, JSON.stringify(presenceData)),
        this.redis.sadd(setKey, userId),
        this.redis.expire(setKey, 3600),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to upsert presence for room ${roomId} user ${userId}: ${errorMessage}`,
      );
    }
  }

  async getRoomPresences(roomId: string): Promise<PresenceData[]> {
    const setKey = this.getSetKey(roomId);

    try {
      const userIds = await this.redis.smembers(setKey);
      if (userIds.length === 0) return [];

      const keys = userIds.map((userId) => this.getKey(roomId, userId));
      const presencesJson = await this.redis.mget(...keys);

      const activePresences: PresenceData[] = [];
      const expiredUserIds: string[] = [];

      presencesJson.forEach((json, index) => {
        if (json) {
          activePresences.push(JSON.parse(json) as PresenceData);
        } else {
          expiredUserIds.push(userIds[index]);
        }
      });

      if (expiredUserIds.length > 0) {
        this.redis
          .srem(setKey, ...expiredUserIds)
          .catch((err) =>
            this.logger.error('Failed to cleanup expired presences:', err),
          );
      }

      return activePresences;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to get presences for room ${roomId}: ${errorMessage}`,
      );
      return [];
    }
  }

  async removePresence(roomId: string, userId: string): Promise<void> {
    const key = this.getKey(roomId, userId);
    const setKey = this.getSetKey(roomId);

    try {
      await Promise.all([this.redis.del(key), this.redis.srem(setKey, userId)]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to remove presence for room ${roomId} user ${userId}: ${errorMessage}`,
      );
    }
  }

  async removeRoomPresences(roomId: string): Promise<void> {
    const setKey = this.getSetKey(roomId);

    try {
      const userIds = await this.redis.smembers(setKey);
      if (userIds.length === 0) return;

      const keys = userIds.map((userId) => this.getKey(roomId, userId));
      await Promise.all([this.redis.del(...keys), this.redis.del(setKey)]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to remove presences for room ${roomId}: ${errorMessage}`,
      );
    }
  }
}
