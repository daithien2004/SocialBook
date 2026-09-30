import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { likeKeys, postKeys, recommendationsKeys } from '@/lib/query-keys';
import { toggleLike } from './like.api';
import type {
  LikeRequest,
  ToggleLikeResult,
} from '@/features/likes/schemas/like.schema';

type LikeMutationContext = { snapshot: Array<[QueryKey, unknown]> } | undefined;

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation<ToggleLikeResult, Error, LikeRequest, LikeMutationContext>(
    {
      mutationFn: toggleLike,
      onMutate: async ({ targetId, targetType }) => {
        if (targetType !== 'post') return;

        await queryClient.cancelQueries({ queryKey: postKeys.all });

        // Chụp cache trước khi sửa để khôi phục nếu request thất bại. Thiếu bước
        // này thì like lỗi sẽ nằm lại ở trạng thái "đã thích" trong cache.
        const snapshot = [
          ...queryClient.getQueriesData({ queryKey: postKeys.lists() }),
          ...queryClient.getQueriesData({ queryKey: postKeys.byUserLists() }),
          ...queryClient.getQueriesData({ queryKey: postKeys.details() }),
        ];

        queryClient.setQueriesData<{
          data: Array<{
            id: string;
            likedByCurrentUser?: boolean;
            likesCount?: number;
          }>;
        }>({ queryKey: postKeys.lists() }, (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p) =>
              p.id === targetId ? updateOptimisticLike(p) : p,
            ),
          };
        });

        queryClient.setQueriesData<{
          data: Array<{
            id: string;
            likedByCurrentUser?: boolean;
            likesCount?: number;
          }>;
        }>({ queryKey: postKeys.byUserLists() }, (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p) =>
              p.id === targetId ? updateOptimisticLike(p) : p,
            ),
          };
        });

        queryClient.setQueriesData<{
          id: string;
          likedByCurrentUser?: boolean;
          likesCount?: number;
        } | null>({ queryKey: postKeys.details() }, (old) => {
          if (!old || old.id !== targetId) return old;
          return updateOptimisticLike(old);
        });

        return { snapshot };
      },
      onError: (_error, _variables, context) => {
        context?.snapshot.forEach(([key, data]) =>
          queryClient.setQueryData(key, data),
        );
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
    },
  );
}

function updateOptimisticLike(p: {
  id: string;
  likedByCurrentUser?: boolean;
  likesCount?: number;
}) {
  const wasLiked = p.likedByCurrentUser ?? false;
  return {
    ...p,
    likedByCurrentUser: !wasLiked,
    likesCount: Math.max(0, (p.likesCount || 0) + (wasLiked ? -1 : 1)),
  };
}
