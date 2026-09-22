import { z } from 'zod';

export const postAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  image: z.string().nullable().optional(),
  violationCount: z.number().optional(),
});
export type PostAuthor = z.infer<typeof postAuthorSchema>;

export const postBookSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().optional(),
  coverUrl: z.string().optional(),
  authorId: z
    .object({
      name: z.string(),
      bio: z.string(),
    })
    .optional(),
});
export type PostBook = z.infer<typeof postBookSchema>;

export const rawPostSchema = z.object({
  id: z.string(),
  content: z.string(),
  imageUrls: z.array(z.string()),
  isFlagged: z.boolean(),
  moderationStatus: z.string().optional(),
  moderationReason: z.string().optional(),
  user: postAuthorSchema.optional(),
  book: postBookSchema.optional(),
  likesCount: z.number().optional(),
  commentsCount: z.number().optional(),
  likedByCurrentUser: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RawPost = z.infer<typeof rawPostSchema>;

export const postSchema = z.object({
  id: z.string(),
  content: z.string(),
  imageUrls: z.array(z.string()),
  isFlagged: z.boolean(),
  moderationStatus: z.string().optional(),
  moderationReason: z.string().optional(),
  user: postAuthorSchema.optional(),
  book: postBookSchema.optional(),
  totalLikes: z.number().optional(),
  totalComments: z.number().optional(),
  likedByCurrentUser: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Post = z.infer<typeof postSchema>;

export function normalizePost(raw: RawPost): Post {
  return {
    id: raw.id,
    content: raw.content,
    imageUrls: raw.imageUrls,
    isFlagged: raw.isFlagged,
    moderationStatus: raw.moderationStatus,
    moderationReason: raw.moderationReason,
    user: raw.user,
    book: raw.book,
    totalLikes: raw.likesCount,
    totalComments: raw.commentsCount,
    likedByCurrentUser: raw.likedByCurrentUser,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const rawPaginatedPostsSchema = z.object({
  data: z.array(rawPostSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type RawPaginatedPosts = z.infer<typeof rawPaginatedPostsSchema>;

export const paginatedPostsSchema = z.object({
  data: z.array(postSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type PaginatedPostsResponse = z.infer<typeof paginatedPostsSchema>;

export function normalizePaginatedPosts(raw: RawPaginatedPosts): PaginatedPostsResponse {
  return {
    data: raw.data.map(normalizePost),
    meta: {
      nextCursor: raw.meta.nextCursor,
      hasMore: raw.meta.hasMore,
    },
  };
}

export const postWithModerationSchema = z.object({
  data: postSchema,
  warning: z.string().optional(),
  message: z.string().optional(),
});
export type PostWithModerationResult = z.infer<typeof postWithModerationSchema>;

export function normalizePostWithModeration(
  raw: { data: RawPost; warning?: string; message?: string },
): PostWithModerationResult {
  return {
    data: normalizePost(raw.data),
    warning: raw.warning,
    message: raw.message,
  };
}

export const createPostRequestSchema = z.object({
  bookId: z.string(),
  content: z.string(),
  images: z.array(z.instanceof(File)).optional(),
});
export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;

export const updatePostRequestSchema = z.object({
  content: z.string().optional(),
  bookId: z.string().optional(),
  images: z.array(z.instanceof(File)).optional(),
  imageUrls: z.array(z.string()).optional(),
});
export type UpdatePostRequest = z.infer<typeof updatePostRequestSchema>;

export const paginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().optional(),
});
export type PaginationParams = z.infer<typeof paginationParamsSchema>;

export const paginationParamsByUserSchema = paginationParamsSchema.extend({
  userId: z.string(),
});
export type PaginationParamsByUser = z.infer<typeof paginationParamsByUserSchema>;

export const deleteImageRequestSchema = z.object({
  imageUrl: z.string(),
});
export type DeleteImageRequest = z.infer<typeof deleteImageRequestSchema>;

export const trendingBookSchema = z.object({
  bookId: z.string(),
  title: z.string(),
  coverImage: z.string().optional(),
  score: z.number(),
  slug: z.string(),
});
export type TrendingBook = z.infer<typeof trendingBookSchema>;

export const topReaderSchema = z.object({
  userId: z.string(),
  username: z.string(),
  avatar: z.string().optional(),
  score: z.number(),
});
export type TopReader = z.infer<typeof topReaderSchema>;