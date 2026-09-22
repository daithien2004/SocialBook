import { z } from 'zod';
import { paginationMetaSchema, type PaginationMetaData } from '@/lib/pagination.schema';

export const genreSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Genre = z.infer<typeof genreSchema>;

export const genrePageSchema = z.object({
  data: z.array(genreSchema),
  meta: paginationMetaSchema,
});
export type GenrePage = z.infer<typeof genrePageSchema>;
export type PaginatedData<T> = { data: T[]; meta: PaginationMetaData };

export const createGenreSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});
export type CreateGenreRequest = z.infer<typeof createGenreSchema>;

export const updateGenreRequestSchema = z.object({
  id: z.string(),
  data: createGenreSchema.partial(),
});
export type UpdateGenreRequest = z.infer<typeof updateGenreRequestSchema>;