import { apiRequest, idempotentApiRequest } from '@/lib/api-client';
import type { ApiRequestBody, ApiResponse } from '@/lib/api-types';
import type { ChapterDetailData } from '@/features/chapters/types/chapter.interface';

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

export type CreateRoomResponse = ApiResponse<'/api/v1/reading-rooms', 'post'>;

export async function getRoom(code: string): Promise<RoomResponse> {
  return apiRequest<RoomResponse>({
    url: `/reading-rooms/${code}`,
    method: 'GET',
  });
}

export async function getCurrentRoomChapter(
  code: string,
): Promise<ChapterDetailData> {
  return apiRequest<ChapterDetailData>({
    url: `/reading-rooms/${code}/current-chapter`,
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
  idempotencyKey: string,
): Promise<CreateRoomResponse> {
  return idempotentApiRequest<CreateRoomResponse>(
    {
      url: '/reading-rooms',
      method: 'POST',
      data: body,
    },
    idempotencyKey,
  );
}

export async function reactivateRoom(code: string): Promise<void> {
  return apiRequest<void>({
    url: `/reading-rooms/${code}/reactivate`,
    method: 'PATCH',
  });
}
