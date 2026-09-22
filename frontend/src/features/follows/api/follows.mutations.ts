import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFollow, unfollow } from './follows.api';
import { followKeys } from '@/lib/query-keys';

export function useToggleFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => toggleFollow(targetUserId),
    onSuccess: (_data, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: followKeys.all });
      queryClient.invalidateQueries({
        queryKey: followKeys.status(targetUserId),
      });
    },
  });
}

export function useUnfollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetId: string) => unfollow(targetId),
    onSuccess: (_data, targetId) => {
      queryClient.invalidateQueries({ queryKey: followKeys.all });
      queryClient.invalidateQueries({
        queryKey: followKeys.status(targetId),
      });
    },
  });
}