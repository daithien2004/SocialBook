import { apiRequest } from '@/lib/nestjs-client-api';
import { normalizeArrayResponse } from '@/lib/api-response';
import type { ArrayResponse, PaginatedApiResult } from '@/lib/api-response';

export interface FlaggedPost {
  id: string;
  user: {
    id: string;
    username: string;
    image?: string;
    violationCount?: number;
  };
  book: {
    id: string;
    title: string;
  };
  content: string;
  imageUrls: string[];
  isFlagged: boolean;
  moderationReason?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export type FlaggedPostsResponse = PaginatedApiResult<FlaggedPost>;

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
  const response = await apiRequest<ArrayResponse<FlaggedPost>>({
    url: '/posts/admin/flagged',
    method: 'GET',
    params: queryParams,
  });
  return normalizeArrayResponse<FlaggedPost>(response);
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