import { likeKeys } from '@/lib/query-keys';
import { getLikeCount, getLikeStatus } from './like.api';
import type {
  LikeCountResponse,
  LikeRequest,
  LikeStatusResponse,
} from '@/features/likes/schemas/like.schema';

export const likeQueries = {
  count(request: LikeRequest) {
    return {
      queryKey: likeKeys.count(request),
      queryFn: (): Promise<LikeCountResponse> => getLikeCount(request),
    };
  },
  status(request: LikeRequest) {
    return {
      queryKey: likeKeys.status(request),
      queryFn: (): Promise<LikeStatusResponse> => getLikeStatus(request),
    };
  },
};