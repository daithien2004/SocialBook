import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import type {
  IPresenceCachePort,
  PresenceData,
} from '@/domain/reading-rooms/interfaces/presence-cache.port';
import { PRESENCE_HASH_TTL_SECONDS } from '@/presentation/gateways/reading-room/reading-room.constants';

function isPresenceData(data: unknown): data is PresenceData {
  if (!data || typeof data !== 'object') return false;
  return 'userId' in data && 'currentChapterSlug' in data;
}

@Injectable()
export class PresenceCacheAdapter implements IPresenceCachePort {
  private readonly logger = new Logger(PresenceCacheAdapter.name);

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
  ): Promise<{ created: boolean; chapterChanged: boolean }> {
    const key = this.getKey(roomId, userId);
    const setKey = this.getSetKey(roomId);

    const presenceData: PresenceData = {
      ...data,
      lastSeen: Date.now(),
    };

    let created = true;
    let chapterChanged = false;

    try {
      const script = `
        local oldVal = redis.call('GET', KEYS[1])
        redis.call('SETEX', KEYS[1], ${String(PRESENCE_HASH_TTL_SECONDS)}, ARGV[1])
        redis.call('SADD', KEYS[2], ARGV[2])
        redis.call('EXPIRE', KEYS[2], 3600)
        return oldVal
      `;
      const oldValStr = await this.redis.eval(
        script,
        2,
        key,
        setKey,
        JSON.stringify(presenceData),
        userId,
      );

      if (typeof oldValStr === 'string') {
        created = false;
        try {
          const oldData: unknown = JSON.parse(oldValStr);
          if (
            isPresenceData(oldData) &&
            oldData.currentChapterSlug !== data.currentChapterSlug
          ) {
            chapterChanged = true;
          }
        } catch {
          // Ignore parse error
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to upsert presence for room ${roomId} user ${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    return { created, chapterChanged };
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
          const parsed: unknown = JSON.parse(json);
          if (isPresenceData(parsed)) {
            activePresences.push(parsed);
          }
        } else {
          expiredUserIds.push(userIds[index]);
        }
      });

      if (expiredUserIds.length > 0) {
        this.redis.srem(setKey, ...expiredUserIds).catch((err) => {
          this.logger.error(
            'Failed to cleanup expired presences',
            err instanceof Error ? err.stack : String(err),
          );
        });
      }

      return activePresences;
    } catch (err) {
      this.logger.error(
        `Failed to get presences for room ${roomId}`,
        err instanceof Error ? err.stack : String(err),
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
      this.logger.error(
        `Failed to remove presence for room ${roomId} user ${userId}`,
        err instanceof Error ? err.stack : String(err),
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
      this.logger.error(
        `Failed to remove presences for room ${roomId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
