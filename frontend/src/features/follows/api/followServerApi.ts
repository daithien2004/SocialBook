import { serverApiRequest } from '@/lib/api-server';
import type { FollowStateResponse } from '@/features/follows/types/follow.interface';

export async function followServerApi() {
  return {
    async getFollowState(targetUserId: string): Promise<FollowStateResponse | null> {
      try {
        const res = await serverApiRequest<FollowStateResponse>(
          `/follows/status?targetId=${targetUserId}`
        );
        return res;
      } catch (err: unknown) {
        console.log('getFollowState error:', err);
        return null;
      }
    },
  };
}