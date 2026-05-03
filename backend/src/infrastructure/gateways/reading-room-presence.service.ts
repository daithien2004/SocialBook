import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export interface PresenceData {
  userId: string;
  displayName: string;
  avatarUrl: string;
  currentChapterSlug: string;
  paragraphId?: string;
  lastSeen: number;
}

@Injectable()
export class ReadingRoomPresenceService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  private getKey(roomId: string, userId: string): string {
    return `presence:${roomId}:${userId}`;
  }

  private getSetKey(roomId: string): string {
    return `room:members:${roomId}`;
  }

  async upsertPresence(roomId: string, userId: string, data: Omit<PresenceData, 'lastSeen'>): Promise<void> {
    const key = this.getKey(roomId, userId);
    const setKey = this.getSetKey(roomId);
    
    const presenceData: PresenceData = {
      ...data,
      lastSeen: Date.now(),
    };
    
    await Promise.all([
      // Set individual presence with 30s TTL (safer margin than 15s)
      this.redis.setex(key, 30, JSON.stringify(presenceData)),
      // Track member in room set
      this.redis.sadd(setKey, userId),
      // Set room set TTL for 1 hour to ensure cleanup if heartbeat fails
      this.redis.expire(setKey, 3600),
    ]);
  }

  async getRoomPresences(roomId: string): Promise<PresenceData[]> {
    const setKey = this.getSetKey(roomId);
    const userIds = await this.redis.smembers(setKey);
    
    if (userIds.length === 0) {
      return [];
    }

    const keys = userIds.map(userId => this.getKey(roomId, userId));
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

    // Cleanup expired users from the set in background
    if (expiredUserIds.length > 0) {
      this.redis.srem(setKey, ...expiredUserIds).catch(err => 
        console.error('Failed to cleanup expired presences:', err)
      );
    }

    return activePresences;
  }

  async removePresence(roomId: string, userId: string): Promise<void> {
    const key = this.getKey(roomId, userId);
    const setKey = this.getSetKey(roomId);
    
    await Promise.all([
      this.redis.del(key),
      this.redis.srem(setKey, userId),
    ]);
  }
}
