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
  /**
   * chapterId → bookId đã xác minh. Lưu kèm bookId chứ không lưu chapterId
   * đơn thuần để không dùng nhầm khi user đổi sang phòng của sách khác.
   */
  verifiedChapters?: Map<string, string>;
  pendingProgress?: {
    bookId: string;
    chapterId: string;
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
