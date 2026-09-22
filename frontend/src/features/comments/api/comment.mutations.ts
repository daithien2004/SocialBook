import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentKeys, likeKeys, postKeys } from '@/lib/query-keys';
import { toggleLike } from '@/features/likes/api/like.api';
import {
  createComment,
  deleteComment,
  updateComment,
} from './comment.api';
import type {
  CreateCommentRequest,
  CreatedComment,
  DeleteCommentRequest,
  EditCommentRequest,
} from '@/features/comments/schemas/comment.schema';

export interface ToggleCommentLikeRequest {
  targetId: string;
  targetType: string;
  parentId?: string | null;
}

function invalidateCommentTarget(
  queryClient: ReturnType<typeof useQueryClient>,
  targetId: string,
  parentId?: string | null,
) {
  queryClient.invalidateQueries({
    queryKey: commentKeys.byTargetPrefix(targetId, parentId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation<CreatedComment, Error, CreateCommentRequest>({
    mutationFn: createComment,
    onSuccess: (result, variables) => {
      invalidateCommentTarget(queryClient, result.targetId, result.parentId);
      queryClient.invalidateQueries({
        queryKey: commentKeys.count({
          targetId: result.targetId,
          targetType: result.targetType,
        }),
      });

      if (variables.targetType === 'post' && !variables.parentId) {
        queryClient.setQueriesData<
          { data: Array<{ id: string; commentsCount?: number }> }
        >({ queryKey: postKeys.lists() }, (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p) =>
              p.id === variables.targetId
                ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
                : p,
            ),
          };
        });

        queryClient.setQueriesData<
          { data: Array<{ id: string; commentsCount?: number }> }
        >({ queryKey: postKeys.byUserLists() }, (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p) =>
              p.id === variables.targetId
                ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
                : p,
            ),
          };
        });

        queryClient.setQueriesData<
          { id: string; commentsCount?: number } | null
        >({ queryKey: postKeys.details() }, (old) => {
          if (!old || old.id !== variables.targetId) return old;
          return {
            ...old,
            commentsCount: (old.commentsCount || 0) + 1,
          };
        });
      }
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation<CreatedComment, Error, EditCommentRequest>({
    mutationFn: updateComment,
    onSuccess: (_data, variables) => {
      invalidateCommentTarget(queryClient, variables.targetId, variables.parentId);
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string }, Error, DeleteCommentRequest>({
    mutationFn: deleteComment,
    onSuccess: (_data, variables) => {
      invalidateCommentTarget(queryClient, variables.targetId, variables.parentId);
    },
  });
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();
  return useMutation<{ isLiked: boolean }, Error, ToggleCommentLikeRequest>({
    mutationFn: ({ targetId, targetType }) =>
      toggleLike({ targetId, targetType }),
    onSuccess: (_data, variables) => {
      invalidateCommentTarget(queryClient, variables.targetId, variables.parentId);
      queryClient.invalidateQueries({
        queryKey: likeKeys.status({
          targetId: variables.targetId,
          targetType: variables.targetType,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: likeKeys.count({
          targetId: variables.targetId,
          targetType: variables.targetType,
        }),
      });
    },
  });
}