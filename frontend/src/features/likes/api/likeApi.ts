export { likeQueries } from '@/features/likes/api/like.queries';
export { useToggleLike } from '@/features/likes/api/like.mutations';
export {
  toggleLike,
  getLikeCount,
  getLikeStatus,
} from '@/features/likes/api/like.api';
export type {
  LikeRequest,
  ToggleLikeResult,
  LikeCountResponse,
  LikeStatusResponse,
} from '@/features/likes/schemas/like.schema';