import { z } from 'zod';

export const commentAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  image: z.string().nullable().optional(),
});
export type CommentAuthor = z.infer<typeof commentAuthorSchema>;

export const commentItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  likesCount: z.number(),
  isLiked: z.boolean(),
  repliesCount: z.number(),
  parentId: z.string().nullable(),
  user: commentAuthorSchema,
});
export type CommentItem = z.infer<typeof commentItemSchema>;

export const commentsTargetResponseSchema = z.object({
  comments: z.array(commentItemSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type CommentsTargetResponse = z.infer<typeof commentsTargetResponseSchema>;

export function normalizeCommentsTargetResponse(
  response: CommentsTargetResponse,
): GetCommentsResponse {
  return {
    comments: response.comments,
    nextCursor: response.meta.nextCursor,
    hasMore: response.meta.hasMore,
  };
}

export interface GetCommentsResponse {
  comments: CommentItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const getCommentsRequestSchema = z.object({
  targetId: z.string(),
  parentId: z.string().nullable(),
  cursor: z.string().optional(),
  limit: z.number(),
});
export type GetCommentsRequest = z.infer<typeof getCommentsRequestSchema>;

export const commentRequestSchema = z.object({
  targetId: z.string(),
  targetType: z.string(),
});
export type CommentRequest = z.infer<typeof commentRequestSchema>;

export const createCommentRequestSchema = z.object({
  targetType: z.string(),
  targetId: z.string(),
  content: z.string(),
  parentId: z.string().nullable(),
});
export type CreateCommentRequest = z.infer<typeof createCommentRequestSchema>;

export const createdCommentSchema = z.object({
  id: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  parentId: z.string().nullable(),
  content: z.string(),
});
export type CreatedComment = z.infer<typeof createdCommentSchema>;

export const editCommentRequestSchema = z.object({
  id: z.string(),
  content: z.string(),
  targetId: z.string(),
  parentId: z.string().nullable().optional(),
});
export type EditCommentRequest = z.infer<typeof editCommentRequestSchema>;

export const deleteCommentRequestSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  parentId: z.string().nullable().optional(),
});
export type DeleteCommentRequest = z.infer<typeof deleteCommentRequestSchema>;