import { readingRoomsKeys } from '@/lib/query-keys';
import {
  getMyActiveRooms,
  getMyHistory,
  getRoom,
  type RoomHistoryResponse,
  type RoomResponse,
} from './reading-rooms.api';

export const readingRoomQueries = {
  room: (code: string) => ({
    queryKey: readingRoomsKeys.room(code),
    queryFn: (): Promise<RoomResponse> => getRoom(code),
  }),
  myActive: () => ({
    queryKey: readingRoomsKeys.myActive(),
    queryFn: (): Promise<RoomResponse[]> => getMyActiveRooms(),
  }),
  myHistory: () => ({
    queryKey: readingRoomsKeys.myHistory(),
    queryFn: (): Promise<RoomHistoryResponse> => getMyHistory(),
  }),
};