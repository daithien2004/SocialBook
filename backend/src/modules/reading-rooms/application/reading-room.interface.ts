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
  members: Array<{ userId: string; role: 'host' | 'member' }>;
}

export type ReadingRoomSummaryResult = Pick<
  ReadingRoomResult,
  | 'roomId'
  | 'bookId'
  | 'hostId'
  | 'mode'
  | 'status'
  | 'currentChapterSlug'
  | 'maxMembers'
  | 'membersCount'
  | 'createdAt'
  | 'members'
>;

export interface LeaveRoomResult extends ReadingRoomResult {
  roomEnded: boolean;
}
