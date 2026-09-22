import { apiRequest } from '@/lib/nestjs-client-api';
import { normalizeArrayResponse } from '@/lib/api-response';
import type { ArrayResponse, PaginatedApiResult } from '@/lib/api-response';

export interface ToxicWord {
  id: string;
  pattern: string;
  group: string;
  originalWord: string;
  createdAt: string;
  updatedAt: string;
}

export type ToxicWordsResponse = PaginatedApiResult<ToxicWord>;

export interface AddToxicWordPayload {
  pattern: string;
  group: string;
}

export interface GetToxicWordsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getToxicWords(
  params?: GetToxicWordsParams,
): Promise<ToxicWordsResponse> {
  const queryParams = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    search: params?.search,
  };
  const response = await apiRequest<ArrayResponse<ToxicWord>>({
    url: '/admin/toxic-words',
    method: 'GET',
    params: queryParams,
  });
  return normalizeArrayResponse<ToxicWord>(response);
}

export async function addToxicWord(
  payload: AddToxicWordPayload,
): Promise<ToxicWord> {
  return apiRequest<ToxicWord>({
    url: '/admin/toxic-words',
    method: 'POST',
    data: payload,
  });
}

export async function deleteToxicWord(id: string): Promise<void> {
  return apiRequest<void>({
    url: `/admin/toxic-words/${id}`,
    method: 'DELETE',
  });
}