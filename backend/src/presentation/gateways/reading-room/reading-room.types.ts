import { Socket, DefaultEventsMap } from 'socket.io';
import { PresenceData } from '@/domain/reading-rooms/interfaces/presence-cache.port';

/**
 * SocketData của namespace /reading-rooms.
 *
 * `userId` và `role` là BẮT BUỘC: middleware xác thực trong `afterInit`
 * chỉ cho phép kết nối qua khi đã verify token và gán 2 trường này
 * (thiếu thì `next(new Error('unauthorized'))` chặn từ đầu).
 */
export interface SocketData {
  userId: string;
  role: string;
  displayName?: string;
  avatarUrl?: string;
  roomId?: string;
  bookId?: string;
}

/** Socket đã được middleware điền `socket.data: SocketData`. */
export type RoomSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

export interface RoomSnapshot {
  room: {
    roomId: string;
    bookId: string;
    hostId: string;
    mode: string;
    currentChapterSlug: string;
    status: string;
    highlights: Array<{
      id: string;
      userId: string;
      displayName: string;
      avatarUrl: string;
      chapterSlug: string;
      paragraphId: string;
      content: string;
      aiInsight?: string;
      createdAt: Date;
      user: {
        userId: string;
        displayName: string;
        avatarUrl: string;
      };
    }>;
  };
  members: Array<{
    userId: string;
    role: string;
  }>;
  presences: PresenceData[];
}
