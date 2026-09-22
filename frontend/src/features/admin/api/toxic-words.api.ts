import { apiRequest } from '@/lib/nestjs-client-api';
import { z } from 'zod';
import { paginationMetaSchema } from '@/lib/pagination.schema';

export const toxicWordSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  group: z.string(),
  originalWord: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ToxicWord = z.infer<typeof toxicWordSchema>;

export const toxicWordsPageSchema = z.object({
  data: z.array(toxicWordSchema),
  meta: paginationMetaSchema,
});
export type ToxicWordsResponse = z.infer<typeof toxicWordsPageSchema>;

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
  const response = await apiRequest<unknown>({
    url: '/admin/toxic-words',
    method: 'GET',
    params: queryParams,
  });
  return toxicWordsPageSchema.parse(response);
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