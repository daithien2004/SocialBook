import { apiRequest } from '@/lib/api-client';

export interface RoomResponse {
  roomId: string;
  bookId: string;
  hostId: string;
  mode: 'sync' | 'free' | 'discussion';
  status: string;
  currentChapterSlug: string;
  highlights?: Array<{
    id: string;
    userId: string;
    chapterSlug: string;
    paragraphId: string;
    content: string;
    aiInsight?: string;
    createdAt: string;
  }>;
  chatMessages?: Array<{
    userId: string;
    role: 'user' | 'ai';
    content: string;
    createdAt: string;
  }>;
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

export async function createRoom(body: CreateRoomPayload): Promise<RoomResponse> {
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