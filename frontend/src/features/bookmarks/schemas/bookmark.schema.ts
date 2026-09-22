import { z } from 'zod';

export const bookmarkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  chapterId: z.string(),
  chapterSlug: z.string(),
  paragraphId: z.string(),
  textPreview: z.string(),
});
export type Bookmark = z.infer<typeof bookmarkSchema>;

export const createBookmarkRequestSchema = z.object({
  bookId: z.string(),
  chapterId: z.string(),
  chapterSlug: z.string(),
  paragraphId: z.string(),
  textPreview: z.string(),
});
export type CreateBookmarkRequest = z.infer<typeof createBookmarkRequestSchema>;