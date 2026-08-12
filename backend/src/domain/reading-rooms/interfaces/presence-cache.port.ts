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
    data: Omit<PresenceData, 'lastSeen'>,
  ): Promise<void>;
  abstract getRoomPresences(roomId: string): Promise<PresenceData[]>;
  abstract removePresence(roomId: string, userId: string): Promise<void>;
  abstract removeRoomPresences(roomId: string): Promise<void>;
}
