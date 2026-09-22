import { apiRequest } from '@/lib/nestjs-client-api';
import {
  followingUserPageSchema,
  followStateSchema,
  FollowingUser,
  FollowStateResponse,
} from '@/features/follows/schemas/follow.schema';

export async function getFollowingList(
  userId: string,
): Promise<FollowingUser[]> {
  const response = await apiRequest<{
    data: unknown[];
    meta: { current: number; pageSize: number; total: number; totalPages: number };
  }>({
    url: `/follows/following?userId=${userId}`,
    method: 'GET',
  });
  return followingUserPageSchema.parse(response).data;
}

export async function getFollowersList(
  targetUserId: string,
): Promise<FollowingUser[]> {
  const response = await apiRequest<{
    data: unknown[];
    meta: { current: number; pageSize: number; total: number; totalPages: number };
  }>({
    url: `/follows/followers?targetUserId=${targetUserId}`,
    method: 'GET',
  });
  return followingUserPageSchema.parse(response).data;
}

export async function getFollowStatus(
  targetId: string,
): Promise<FollowStateResponse> {
  const response = await apiRequest<unknown>({
    url: `/follows/status?targetId=${targetId}`,
    method: 'GET',
  });
  return followStateSchema.parse(response);
}

export async function toggleFollow(targetUserId: string): Promise<void> {
  await apiRequest<void>({
    url: '/follows',
    method: 'POST',
    data: { targetId: targetUserId },
  });
}

export async function unfollow(targetId: string): Promise<void> {
  await apiRequest<void>({
    url: `/follows/${targetId}`,
    method: 'DELETE',
  });
}