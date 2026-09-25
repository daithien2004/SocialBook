import { apiRequest } from '@/lib/api-client';
import { z } from 'zod';
import { paginationMetaSchema } from '@/lib/pagination.schema';

export const flaggedPostSchema = z.object({
  id: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    image: z.string().optional(),
    violationCount: z.number().optional(),
  }),
  book: z.object({
    id: z.string(),
    title: z.string(),
  }),
  content: z.string(),
  imageUrls: z.array(z.string()),
  isFlagged: z.boolean(),
  moderationReason: z.string().optional(),
  moderationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FlaggedPost = z.infer<typeof flaggedPostSchema>;

export const flaggedPostsPageSchema = z.object({
  data: z.array(flaggedPostSchema),
  meta: paginationMetaSchema,
});
export type FlaggedPostsResponse = z.infer<typeof flaggedPostsPageSchema>;

export interface GetFlaggedPostsParams {
  page?: number;
  limit?: number;
  reason?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
}

export interface ModerationStats {
  total: number;
  toxic: number;
  spoiler: number;
  other: number;
}

export async function getFlaggedPosts(
  params?: GetFlaggedPostsParams,
): Promise<FlaggedPostsResponse> {
  const queryParams = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    reason: params?.reason,
    startDate: params?.startDate,
    endDate: params?.endDate,
    sortBy: params?.sortBy,
  };
  const response = await apiRequest<unknown>({
    url: '/posts/admin/flagged',
    method: 'GET',
    params: queryParams,
  });
  return flaggedPostsPageSchema.parse(response);
}

export async function getModerationStats(): Promise<ModerationStats> {
  return apiRequest<ModerationStats>({
    url: '/posts/admin/moderation/stats',
    method: 'GET',
  });
}

export async function approvePost(postId: string): Promise<void> {
  return apiRequest<void>({
    url: `/posts/admin/${postId}/approve`,
    method: 'PATCH',
  });
}

export async function rejectPost(postId: string): Promise<void> {
  return apiRequest<void>({
    url: `/posts/admin/${postId}/reject`,
    method: 'DELETE',
  });
}

export async function bulkApprovePosts(postIds: string[]): Promise<void> {
  return apiRequest<void>({
    url: '/posts/admin/bulk-approve',
    method: 'POST',
    data: { postIds },
  });
}

export async function bulkRejectPosts(postIds: string[]): Promise<void> {
  return apiRequest<void>({
    url: '/posts/admin/bulk-reject',
    method: 'POST',
    data: { postIds },
  });
}