import { useToggleLike } from '@/features/likes/api/like.mutations';
import { useOptimisticToggle } from '@/hooks/useOptimisticToggle';

interface UsePostLikeOptions {
  postId: string;
  initialLikeCount?: number;
  initialLikeStatus?: boolean;
}

export function usePostLike({
  postId,
  initialLikeCount = 0,
  initialLikeStatus = false,
}: UsePostLikeOptions) {
  const toggleLikeMutation = useToggleLike();

  const {
    count: likeCount,
    isActive: isLiked,
    toggle: toggleLike,
  } = useOptimisticToggle({
    initialCount: initialLikeCount,
    initialState: initialLikeStatus,
    onToggle: () =>
      toggleLikeMutation.mutateAsync({ targetId: postId, targetType: 'post' }),
  });

  return {
    likeCount,
    isLiked,
    toggleLike,
  };
}
