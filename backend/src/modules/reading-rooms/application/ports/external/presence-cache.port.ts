export interface PresenceData {
  userId: string;
  displayName: string;
  avatarUrl: string;
  currentChapterSlug: string;
  paragraphId?: string;
  progress?: number;
  lastSeen: number;
}

export abstract class IPresenceCachePort {
  abstract upsertPresence(
    roomId: string,
    userId: string,
    socketId: string,
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<{ created: boolean; chapterChanged: boolean }>;
  abstract getRoomPresences(roomId: string): Promise<PresenceData[]>;
  abstract removeSocketPresence(
    roomId: string,
    userId: string,
    socketId: string,
  ): Promise<boolean>;
  abstract removeUserPresences(roomId: string, userId: string): Promise<void>;
  abstract removeRoomPresences(roomId: string): Promise<void>;
}
