import { useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useDeleteComment } from '@/features/comments/api/comment.mutations';
import type { CommentItem } from '@/features/comments/types/comment.interface';

export function useCommentDelete(
  comment: CommentItem,
  targetId: string,
  onReplyRemoved?: () => void
) {
  const deleteComment = useDeleteComment();

  const handleDeleteComment = useCallback(async () => {
    try {
      await deleteComment.mutateAsync({
        id: comment.id,
        targetId,
        parentId: comment.parentId ?? null,
      });

      if (onReplyRemoved) {
        onReplyRemoved();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }, [comment, targetId, deleteComment, onReplyRemoved]);

  return { handleDeleteComment, isDeletingComment: deleteComment.isPending };
}
