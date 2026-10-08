import { Injectable } from '@nestjs/common';
import {
  IPresenceCachePort,
  PresenceData,
} from '@/modules/reading-rooms/domain/interfaces/presence-cache.port';

@Injectable()
export class ReadingRoomPresenceService {
  constructor(private readonly presenceCache: IPresenceCachePort) {}

  async upsertPresence(
    roomId: string,
    userId: string,
    socketId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<{ created: boolean; chapterChanged: boolean }> {
    return this.presenceCache.upsertPresence(roomId, userId, socketId, data);
  }

  async getRoomPresences(roomId: string): Promise<PresenceData[]> {
    return this.presenceCache.getRoomPresences(roomId);
  }

  async removeSocketPresence(
    roomId: string,
    userId: string,
    socketId: string,
  ): Promise<boolean> {
    return this.presenceCache.removeSocketPresence(roomId, userId, socketId);
  }

  async removeUserPresences(roomId: string, userId: string): Promise<void> {
    await this.presenceCache.removeUserPresences(roomId, userId);
  }

  async removeRoomPresences(roomId: string): Promise<void> {
    await this.presenceCache.removeRoomPresences(roomId);
  }
}
