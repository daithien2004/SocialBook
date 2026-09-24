import { cookies } from 'next/headers';
import serverApi from '@/lib/server-api';
import type { FollowStateResponse } from '@/features/follows/types/follow.interface';
import { extractResponseDtoData } from '@/lib/response-dto';
import type { ResponseDto } from '@/types/response';

export async function followServerApi() {
  const cookieHeader = (await cookies()).toString();

  return {
    async getFollowState(targetUserId: string): Promise<FollowStateResponse | null> {
      try {
        const res = await serverApi.get<ResponseDto<FollowStateResponse>>(
          `/follows/status?targetId=${targetUserId}`,
          { headers: { cookie: cookieHeader } },
        );
        return extractResponseDtoData(res.data);
      } catch (err: unknown) {
        console.log('getFollowState error:', err);
        return null;
      }
    },
  };
}