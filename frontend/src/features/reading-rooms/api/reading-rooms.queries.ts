import { readingRoomsKeys } from '@/lib/query-keys';
import type { ChapterDetailData } from '@/features/chapters/types/chapter.interface';
import {
  getMyActiveRooms,
  getMyHistory,
  getRoom,
  getCurrentRoomChapter,
  getRoomHighlights,
  type RoomHistoryResponse,
  type RoomHighlightPage,
  type RoomResponse,
} from './reading-rooms.api';

export const readingRoomQueries = {
  highlights: (code: string) => ({
    queryKey: [...readingRoomsKeys.room(code), 'highlights'] as const,
    queryFn: ({
      pageParam,
    }: {
      pageParam: number;
    }): Promise<RoomHighlightPage> => getRoomHighlights(code, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: RoomHighlightPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  }),
  room: (code: string) => ({
    queryKey: readingRoomsKeys.room(code),
    queryFn: (): Promise<RoomResponse> => getRoom(code),
  }),
  currentChapter: (code: string, chapterSlug: string) => ({
    queryKey: [...readingRoomsKeys.room(code), 'chapter', chapterSlug] as const,
    queryFn: (): Promise<ChapterDetailData> => getCurrentRoomChapter(code),
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
