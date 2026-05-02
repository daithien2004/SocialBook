export interface ReadingRoomResult {
  roomId: string;
  bookId: string;
  hostId: string;
  mode: string;
  status: string;
  currentChapterSlug: string;
  maxMembers: number;
  membersCount: number;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{ userId: string; role: 'host' | 'member' }>;
}
