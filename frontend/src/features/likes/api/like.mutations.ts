import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likeKeys, postKeys, recommendationsKeys } from '@/lib/query-keys';
import { toggleLike } from './like.api';
import type {
  LikeRequest,
  ToggleLikeResult,
} from '@/features/likes/schemas/like.schema';

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation<ToggleLikeResult, Error, LikeRequest>({
    mutationFn: toggleLike,
    onMutate: async ({ targetId, targetType }) => {
      if (targetType !== 'post') return;

      await queryClient.cancelQueries({ queryKey: postKeys.all });

      queryClient.setQueriesData<
        { data: Array<{
          id: string;
          likedByCurrentUser?: boolean;
          totalLikes?: number;
        }> }
      >({ queryKey: postKeys.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((p) =>
            p.id === targetId ? updateOptimisticLike(p) : p,
          ),
        };
      });

      queryClient.setQueriesData<
        { data: Array<{
          id: string;
          likedByCurrentUser?: boolean;
          totalLikes?: number;
        }> }
      >({ queryKey: postKeys.byUserLists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((p) =>
            p.id === targetId ? updateOptimisticLike(p) : p,
          ),
        };
      });

      queryClient.setQueriesData<
        { id: string; likedByCurrentUser?: boolean; totalLikes?: number } | null
      >({ queryKey: postKeys.details() }, (old) => {
        if (!old || old.id !== targetId) return old;
        return updateOptimisticLike(old);
      });
    },
    onSuccess: (_data, { targetId, targetType }) => {
      queryClient.invalidateQueries({
        queryKey: likeKeys.status({ targetId, targetType }),
      });
      queryClient.invalidateQueries({
        queryKey: likeKeys.count({ targetId, targetType }),
      });
    },
    onSettled: (_data, _error, { targetType }) => {
      if (targetType === 'Book') {
        queryClient.invalidateQueries({ queryKey: recommendationsKeys.all });
      }
    },
  });
}

function updateOptimisticLike(p: {
  id: string;
  likedByCurrentUser?: boolean;
  totalLikes?: number;
}) {
  const wasLiked = p.likedByCurrentUser ?? false;
  return {
    ...p,
    likedByCurrentUser: !wasLiked,
    totalLikes: Math.max(0, (p.totalLikes || 0) + (wasLiked ? -1 : 1)),
  };
}