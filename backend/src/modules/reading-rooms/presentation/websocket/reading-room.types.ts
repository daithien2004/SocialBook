import { Socket, DefaultEventsMap } from 'socket.io';
import { PresenceData } from '@/modules/reading-rooms/application/ports/external/presence-cache.port';

/**
 * SocketData c?a namespace /reading-rooms.
 *
 */
export interface SocketData {
  userId: string;
  role: string;
  displayName: string;
  avatarUrl?: string;
  roomId?: string;
  bookId?: string;
}

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
  };
  members: Array<{
    userId: string;
    role: string;
  }>;
  presences: PresenceData[];
}
