import {
  FollowStateResponse,
  FollowingUser,
} from '@/features/follows/schemas/follow.schema';
import {
  getFollowersList,
  getFollowingList,
  getFollowStatus,
} from './follows.api';
import { followKeys } from '@/lib/query-keys';

export const followQueries = {
  following(userId: string) {
    return {
      queryKey: followKeys.following(userId),
      queryFn: (): Promise<FollowingUser[]> => getFollowingList(userId),
    };
  },
  followers(targetUserId: string) {
    return {
      queryKey: followKeys.followers(targetUserId),
      queryFn: (): Promise<FollowingUser[]> => getFollowersList(targetUserId),
    };
  },
  status(targetId: string) {
    return {
      queryKey: followKeys.status(targetId),
      queryFn: (): Promise<FollowStateResponse> => getFollowStatus(targetId),
    };
  },
};