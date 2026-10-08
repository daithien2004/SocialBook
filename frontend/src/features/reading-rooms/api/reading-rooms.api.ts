import { apiRequest } from '@/lib/api-client';

export interface RoomResponse {
  roomId: string;
  bookId: string;
  hostId: string;
  mode: 'sync' | 'free' | 'discussion';
  status: string;
  currentChapterSlug: string;
}

export interface RoomHighlightPage {
  items: Array<{
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string;
    chapterSlug: string;
    paragraphId: string;
    content: string;
    aiInsight?: string;
    createdAt: string;
  }>;
  total: number;
  offset: number;
  limit: number;
}

export interface CreateRoomPayload {
  bookId: string;
  currentChapterSlug: string;
  mode: string;
  maxMembers?: number;
}

export interface RoomHistoryResponse {
  items: RoomResponse[];
  total: number;
}

export async function getRoom(code: string): Promise<RoomResponse> {
  return apiRequest<RoomResponse>({
    url: `/reading-rooms/${code}`,
    method: 'GET',
  });
}

export async function getRoomHighlights(
  code: string,
  offset: number,
  limit = 20,
): Promise<RoomHighlightPage> {
  return apiRequest<RoomHighlightPage>({
    url: `/reading-rooms/${code}/highlights`,
    method: 'GET',
    params: { offset, limit },
  });
}

export async function getMyActiveRooms(): Promise<RoomResponse[]> {
  return apiRequest<RoomResponse[]>({
    url: '/reading-rooms/my-active',
    method: 'GET',
  });
}

export async function getMyHistory(): Promise<RoomHistoryResponse> {
  return apiRequest<RoomHistoryResponse>({
    url: '/reading-rooms/my-history',
    method: 'GET',
  });
}

export async function createRoom(
  body: CreateRoomPayload,
): Promise<RoomResponse> {
  return apiRequest<RoomResponse>({
    url: '/reading-rooms',
    method: 'POST',
    data: body,
  });
}

export async function reactivateRoom(code: string): Promise<RoomResponse> {
  return apiRequest<RoomResponse>({
    url: `/reading-rooms/${code}/reactivate`,
    method: 'PATCH',
  });
}
