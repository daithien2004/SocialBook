import { z } from 'zod';

export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginationMetaData = z.infer<typeof paginationMetaSchema>;
