import { apiRequest } from '@/lib/api-client';
import { NESTJS_AUTHORS_ENDPOINTS } from '@/constants/server-endpoints';
import {
  authorPageSchema,
  authorSchema,
  type Author,
  type AuthorPage,
  type CreateAuthorRequest,
  type UpdateAuthorRequest,
} from '../schemas/author.schema';

export async function getAuthors(params?: {
  page?: number;
  pageSize?: number;
  name?: string;
}): Promise<AuthorPage> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_AUTHORS_ENDPOINTS.getAll,
    method: 'GET',
    params: {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      name: params?.name,
    },
  });
  return authorPageSchema.parse(payload);
}

export async function getAllAuthors(): Promise<Author[]> {
  const payload = await apiRequest<unknown>({
    url: '/authors',
    method: 'GET',
    params: { limit: 1000 },
  });
  return authorSchema.array().parse(payload);
}

export async function getAuthor(id: string): Promise<Author> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_AUTHORS_ENDPOINTS.getById(id),
    method: 'GET',
  });
  return authorSchema.parse(payload);
}

export async function createAuthor(body: CreateAuthorRequest | FormData): Promise<Author> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_AUTHORS_ENDPOINTS.create,
    method: 'POST',
    data: body,
  });
  return authorSchema.parse(payload);
}

export async function updateAuthor({ id, data }: UpdateAuthorRequest): Promise<Author> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_AUTHORS_ENDPOINTS.update(id),
    method: 'PUT',
    data,
  });
  return authorSchema.parse(payload);
}

export async function deleteAuthor(id: string): Promise<void> {
  await apiRequest<void>({
    url: NESTJS_AUTHORS_ENDPOINTS.delete(id),
    method: 'DELETE',
  });
}