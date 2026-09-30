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
      } catch {
        // Không có trạng thái theo dõi chỉ là "chưa theo dõi" — không phải lỗi
        // đáng làm ồn ào log production.
        return null;
      }
    },
  };
}