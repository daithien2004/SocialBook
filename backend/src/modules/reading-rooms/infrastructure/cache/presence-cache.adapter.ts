import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import type {
  IPresenceCachePort,
  PresenceData,
} from '@/modules/reading-rooms/domain/interfaces/presence-cache.port';
import {
  PRESENCE_HASH_TTL_SECONDS,
  ROOM_MEMBERS_SET_TTL_SECONDS,
} from './presence-cache.constants';

function isPresenceData(data: unknown): data is PresenceData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'userId' in data &&
    typeof data.userId === 'string' &&
    'displayName' in data &&
    typeof data.displayName === 'string' &&
    'avatarUrl' in data &&
    typeof data.avatarUrl === 'string' &&
    'currentChapterSlug' in data &&
    typeof data.currentChapterSlug === 'string' &&
    'lastSeen' in data &&
    typeof data.lastSeen === 'number'
  );
}

@Injectable()
export class PresenceCacheAdapter implements IPresenceCachePort {
  private readonly logger = new Logger(PresenceCacheAdapter.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private getPresenceKey(roomId: string, userId: string, socketId: string) {
    return `presence:${roomId}:${userId}:${socketId}`;
  }

  private getRoomUsersKey(roomId: string) {
    return `room:presence-users:${roomId}`;
  }

  private getUserSocketsKey(roomId: string, userId: string) {
    return `room:presence-sockets:${roomId}:${userId}`;
  }

  async upsertPresence(
    roomId: string,
    userId: string,
    socketId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<{ created: boolean; chapterChanged: boolean }> {
    const presenceKey = this.getPresenceKey(roomId, userId, socketId);
    const userSocketsKey = this.getUserSocketsKey(roomId, userId);
    const roomUsersKey = this.getRoomUsersKey(roomId);
    const presenceData: PresenceData = { ...data, lastSeen: Date.now() };
    const script = `
      local oldVal = redis.call('GET', KEYS[1])
      redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[4])
      redis.call('SADD', KEYS[2], ARGV[2])
      redis.call('EXPIRE', KEYS[2], ARGV[5])
      redis.call('SADD', KEYS[3], ARGV[3])
      redis.call('EXPIRE', KEYS[3], ARGV[5])
      return oldVal
    `;

    try {
      const oldValue = await this.redis.eval(
        script,
        3,
        presenceKey,
        userSocketsKey,
        roomUsersKey,
        JSON.stringify(presenceData),
        socketId,
        userId,
        String(PRESENCE_HASH_TTL_SECONDS),
        String(ROOM_MEMBERS_SET_TTL_SECONDS),
      );
      let chapterChanged = false;
      if (typeof oldValue === 'string') {
        try {
          const oldData: unknown = JSON.parse(oldValue);
          chapterChanged =
            isPresenceData(oldData) &&
            oldData.currentChapterSlug !== data.currentChapterSlug;
        } catch {
          // Replace malformed cached presence with the validated current value.
        }
      }
      return { created: oldValue === null, chapterChanged };
    } catch (error) {
      this.logger.error(
        `Failed to upsert socket presence for room ${roomId} user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getRoomPresences(roomId: string): Promise<PresenceData[]> {
    try {
      const userIds = await this.redis.smembers(this.getRoomUsersKey(roomId));
      const presences = await Promise.all(
        userIds.map(async (userId) => {
          const socketsKey = this.getUserSocketsKey(roomId, userId);
          const socketIds = await this.redis.smembers(socketsKey);
          if (socketIds.length === 0) {
            const cleanupEmptyIndexScript = `
              if redis.call('SCARD', KEYS[1]) == 0 then
                redis.call('DEL', KEYS[1])
                redis.call('SREM', KEYS[2], ARGV[1])
              end
              return 1
            `;
            await this.redis.eval(
              cleanupEmptyIndexScript,
              2,
              socketsKey,
              this.getRoomUsersKey(roomId),
              userId,
            );
            return null;
          }

          const presenceKeys = socketIds.map((socketId) =>
            this.getPresenceKey(roomId, userId, socketId),
          );
          const values = await this.redis.mget(...presenceKeys);
          const active: PresenceData[] = [];
          const expiredSocketIds: string[] = [];
          values.forEach((value, index) => {
            if (value === null) {
              const socketId = socketIds[index];
              expiredSocketIds.push(socketId);
              return;
            }
            try {
              const parsed: unknown = JSON.parse(value);
              if (isPresenceData(parsed)) active.push(parsed);
              else {
                const socketId = socketIds[index];
                expiredSocketIds.push(socketId);
              }
            } catch {
              const socketId = socketIds[index];
              expiredSocketIds.push(socketId);
            }
          });

          if (expiredSocketIds.length > 0) {
            const cleanupScript = `
              for i = 1, #ARGV - 1, 2 do
                if redis.call('EXISTS', ARGV[i + 1]) == 0 then
                  redis.call('SREM', KEYS[1], ARGV[i])
                end
              end
              if redis.call('SCARD', KEYS[1]) == 0 then
                redis.call('DEL', KEYS[1])
                redis.call('SREM', KEYS[2], ARGV[#ARGV])
              end
              return 1
            `;
            const cleanupArgs = expiredSocketIds.flatMap((socketId) => [
              socketId,
              this.getPresenceKey(roomId, userId, socketId),
            ]);
            await this.redis.eval(
              cleanupScript,
              2,
              socketsKey,
              this.getRoomUsersKey(roomId),
              ...cleanupArgs,
              userId,
            );
          }
          if (active.length === 0) {
            return null;
          }
          return active.reduce((latest, current) =>
            current.lastSeen > latest.lastSeen ? current : latest,
          );
        }),
      );
      return presences.filter((presence) => presence !== null);
    } catch (error) {
      this.logger.error(
        `Failed to get presences for room ${roomId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }

  async removeSocketPresence(
    roomId: string,
    userId: string,
    socketId: string,
  ): Promise<boolean> {
    const script = `
      redis.call('DEL', KEYS[1])
      redis.call('SREM', KEYS[2], ARGV[1])
      local remaining = redis.call('SCARD', KEYS[2])
      if remaining == 0 then
        redis.call('DEL', KEYS[2])
        redis.call('SREM', KEYS[3], ARGV[2])
        return 0
      end
      return 1
    `;
    try {
      const result = await this.redis.eval(
        script,
        3,
        this.getPresenceKey(roomId, userId, socketId),
        this.getUserSocketsKey(roomId, userId),
        this.getRoomUsersKey(roomId),
        socketId,
        userId,
      );
      return Number(result) === 1;
    } catch (error) {
      this.logger.error(
        `Failed to remove socket presence for room ${roomId} user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async removeUserPresences(roomId: string, userId: string): Promise<void> {
    const socketsKey = this.getUserSocketsKey(roomId, userId);
    const script = `
      local socketIds = redis.call('SMEMBERS', KEYS[1])
      for _, socketId in ipairs(socketIds) do
        redis.call('DEL', ARGV[1] .. socketId)
      end
      redis.call('DEL', KEYS[1])
      redis.call('SREM', KEYS[2], ARGV[2])
      return #socketIds
    `;
    try {
      await this.redis.eval(
        script,
        2,
        socketsKey,
        this.getRoomUsersKey(roomId),
        `presence:${roomId}:${userId}:`,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove user presences for room ${roomId} user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async removeRoomPresences(roomId: string): Promise<void> {
    const script = `
      local userIds = redis.call('SMEMBERS', KEYS[1])
      for _, userId in ipairs(userIds) do
        local socketsKey = ARGV[1] .. userId
        local socketIds = redis.call('SMEMBERS', socketsKey)
        for _, socketId in ipairs(socketIds) do
          redis.call('DEL', ARGV[2] .. userId .. ':' .. socketId)
        end
        redis.call('DEL', socketsKey)
      end
      redis.call('DEL', KEYS[1])
      return #userIds
    `;
    await this.redis.eval(
      script,
      1,
      this.getRoomUsersKey(roomId),
      `room:presence-sockets:${roomId}:`,
      `presence:${roomId}:`,
    );
  }
}
