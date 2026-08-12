export const PRESENCE_CACHE_TOKEN = 'IPresenceCache';

export interface PresenceData {
  userId: string;
  displayName: string;
  avatarUrl: string;
  currentChapterSlug: string;
  paragraphId?: string;
  progress?: number;
  lastSeen: number;
}

export interface IPresenceCache {
  upsertPresence(
    roomId: string,
    userId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void>;
  getRoomPresences(roomId: string): Promise<PresenceData[]>;
  removePresence(roomId: string, userId: string): Promise<void>;
  removeRoomPresences(roomId: string): Promise<void>;
}
