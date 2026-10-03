import { Socket, DefaultEventsMap } from 'socket.io';

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
  chapterSlugToId?: Map<string, string | null>;
  pendingProgress?: {
    bookId: string;
    chapterSlug: string;
    progress: number;
  };
  progressTimer?: NodeJS.Timeout;
}

/** Socket đã được middleware điền `socket.data: SocketData`. */
export type RoomSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;
