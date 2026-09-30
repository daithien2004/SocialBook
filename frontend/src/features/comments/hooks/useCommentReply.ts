import { useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useCreateComment } from '@/features/comments/api/comment.mutations';
import type { CommentItem } from '@/features/comments/types/comment.interface';

export function useCommentReply(
  comment: CommentItem,
  targetId: string,
  targetType: string,
  depth: number,
  onSuccess: (isMaxDepth: boolean) => void,
  onReplyAdded?: () => void
) {
  const createComment = useCreateComment();

  const handleSubmitReply = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const isMaxDepth = depth === 3;
    const parentId = isMaxDepth ? comment.parentId : comment.id;

    try {
      await createComment.mutateAsync({
        targetType,
        targetId,
        content: trimmedContent,
        parentId,
      });

      onSuccess(isMaxDepth);

      if (isMaxDepth && onReplyAdded) {
        onReplyAdded();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }, [comment, targetId, targetType, depth, createComment, onSuccess, onReplyAdded]);

  return { handleSubmitReply, isPostingReply: createComment.isPending };
}
