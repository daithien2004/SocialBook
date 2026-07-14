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
  highlights: Array<{
    id: string;
    userId: string;
    chapterSlug: string;
    paragraphId: string;
    content: string;
    aiInsight?: string;
    createdAt: Date;
  }>;
  chatMessages: Array<{
    userId: string;
    role: string;
    content: string;
    createdAt: Date;
  }>;
}
