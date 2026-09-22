import { z } from 'zod';
import { paginationMetaSchema } from '@/lib/pagination.schema';

export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Author = z.infer<typeof authorSchema>;

export const authorPageSchema = z.object({
  data: z.array(authorSchema),
  meta: paginationMetaSchema,
});
export type AuthorPage = z.infer<typeof authorPageSchema>;

export const createAuthorSchema = z.object({
  name: z.string(),
  bio: z.string().optional(),
});
export type CreateAuthorRequest = z.infer<typeof createAuthorSchema>;

export type UpdateAuthorPayload = FormData | Partial<{ name: string; bio: string; photoUrl: string }>;
export type UpdateAuthorRequest = { id: string; data: UpdateAuthorPayload };