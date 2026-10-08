import { apiRequest } from '@/lib/api-client';
import type { ApiRequestBody, ApiResponse } from '@/lib/api-types';

export type RoomResponse = ApiResponse<'/api/v1/reading-rooms/{code}', 'get'>;

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

export type CreateRoomPayload = ApiRequestBody<'/api/v1/reading-rooms', 'post'>;

export type RoomHistoryResponse = ApiResponse<
  '/api/v1/reading-rooms/my-history',
  'get'
>;

type ActiveRoomsResponse = ApiResponse<
  '/api/v1/reading-rooms/my-active',
  'get'
>;

type RoomHighlightsResponse = ApiResponse<
  '/api/v1/reading-rooms/{code}/highlights',
  'get'
>;

type ReactivatedRoomResponse = ApiResponse<
  '/api/v1/reading-rooms/{code}/reactivate',
  'patch'
>;

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
  const response = await apiRequest<RoomHighlightsResponse>({
    url: `/reading-rooms/${code}/highlights`,
    method: 'GET',
    params: { offset, limit },
  });
  return {
    items: response.data,
    total: response.meta.total,
    offset,
    limit,
  };
}

export async function getMyActiveRooms(): Promise<RoomResponse[]> {
  const response = await apiRequest<ActiveRoomsResponse>({
    url: '/reading-rooms/my-active',
    method: 'GET',
  });
  return response.data;
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
  return apiRequest<ReactivatedRoomResponse>({
    url: `/reading-rooms/${code}/reactivate`,
    method: 'PATCH',
  });
}
