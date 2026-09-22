import { z } from 'zod';

export const paginationMetaSchema = z.object({
  current: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginationMetaData = z.infer<typeof paginationMetaSchema>;