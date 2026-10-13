import { z } from 'zod';

export const ReadingProgressJobSchema = z
  .object({
    userId: z.uuid(),
    bookId: z.uuid(),
    chapterId: z.uuid(),
    progress: z.number().min(0).max(100),
  })
  .strict();
