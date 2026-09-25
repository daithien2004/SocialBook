import { apiRequest } from '@/lib/api-client';
import { NESTJS_GENRES_ENDPOINTS } from '@/constants/server-endpoints';
import {
  genrePageSchema,
  genreSchema,
  type CreateGenreRequest,
  type Genre,
  type GenrePage,
  type UpdateGenreRequest,
} from '../schemas/genre.schema';

export async function getGenres(params?: {
  page?: number;
  pageSize?: number;
  name?: string;
}): Promise<GenrePage> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_GENRES_ENDPOINTS.getAll,
    method: 'GET',
    params: {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      name: params?.name,
    },
  });
  return genrePageSchema.parse(payload);
}

export async function getAllGenres(): Promise<Genre[]> {
  const payload = await apiRequest<unknown>({
    url: '/genres',
    method: 'GET',
    params: { limit: 1000 },
  });
  return genrePageSchema.parse(payload).data;
}

export async function getGenre(id: string): Promise<Genre> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_GENRES_ENDPOINTS.getById(id),
    method: 'GET',
  });
  return genreSchema.parse(payload);
}

export async function createGenre(body: CreateGenreRequest): Promise<Genre> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_GENRES_ENDPOINTS.create,
    method: 'POST',
    data: body,
  });
  return genreSchema.parse(payload);
}

export async function updateGenre({
  id,
  data,
}: UpdateGenreRequest): Promise<Genre> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_GENRES_ENDPOINTS.update(id),
    method: 'PATCH',
    data,
  });
  return genreSchema.parse(payload);
}

export async function deleteGenre(id: string): Promise<void> {
  await apiRequest<void>({
    url: NESTJS_GENRES_ENDPOINTS.delete(id),
    method: 'DELETE',
  });
}
