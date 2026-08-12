import { Injectable } from '@nestjs/common';
import {
  IPresenceCache,
  PresenceData,
} from '@/domain/reading-rooms/interfaces/presence-cache.interface';

@Injectable()
export class ReadingRoomPresenceService {
  constructor(private readonly presenceCache: IPresenceCache) {}

  async upsertPresence(
    roomId: string,
    userId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void> {
    await this.presenceCache.upsertPresence(roomId, userId, data);
  }

  async getRoomPresences(roomId: string): Promise<PresenceData[]> {
    return this.presenceCache.getRoomPresences(roomId);
  }

  async removePresence(roomId: string, userId: string): Promise<void> {
    await this.presenceCache.removePresence(roomId, userId);
  }

  async removeRoomPresences(roomId: string): Promise<void> {
    await this.presenceCache.removeRoomPresences(roomId);
  }
}
