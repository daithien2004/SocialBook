import { apiRequest } from '@/lib/api-client';
import {
  CreateUserHighlightPayload,
  UpdateUserHighlightPayload,
  UserHighlight,
} from '../types/user-highlight.interface';

export type {
  CreateUserHighlightPayload,
  UpdateUserHighlightPayload,
  UserHighlight,
} from '../types/user-highlight.interface';

export const USER_HIGHLIGHTS_TAGS = {
  HIGHLIGHTS: 'UserHighlights',
} as const;

export async function getHighlightsByBook(bookId: string): Promise<UserHighlight[]> {
  return apiRequest<UserHighlight[]>({
    url: `/user-highlights/book/${bookId}`,
    method: 'GET',
  });
}

export async function getHighlightsByChapter(chapterId: string): Promise<UserHighlight[]> {
  return apiRequest<UserHighlight[]>({
    url: `/user-highlights/chapter/${chapterId}`,
    method: 'GET',
  });
}

export async function createHighlight(
  payload: CreateUserHighlightPayload,
): Promise<UserHighlight> {
  return apiRequest<UserHighlight>({
    url: '/user-highlights',
    method: 'POST',
    data: payload,
  });
}

export async function updateHighlight(
  payload: UpdateUserHighlightPayload,
): Promise<UserHighlight> {
  const { id, ...data } = payload;
  return apiRequest<UserHighlight>({
    url: `/user-highlights/${id}`,
    method: 'PATCH',
    data,
  });
}

export async function deleteHighlight(id: string): Promise<void> {
  return apiRequest<void>({
    url: `/user-highlights/${id}`,
    method: 'DELETE',
  });
}