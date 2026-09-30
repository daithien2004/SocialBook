import { useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useUpdateComment } from '@/features/comments/api/comment.mutations';
import type { CommentItem } from '@/features/comments/types/comment.interface';

export function useCommentEdit(
  comment: CommentItem,
  targetId: string,
  onSuccess: () => void
) {
  const updateComment = useUpdateComment();

  const handleEditComment = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent === comment.content) {
      onSuccess();
      return;
    }

    try {
      await updateComment.mutateAsync({
        id: comment.id,
        content: trimmedContent,
        targetId,
        parentId: comment.parentId ?? null,
      });
      onSuccess();
    } catch (error: unknown) {
      const apiError = error as { status?: number; data?: { message?: string } };
      if (apiError?.status === 400 && apiError?.data?.message) {
        toast.error(`Sửa thất bại: ${apiError.data.message}`);
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  }, [comment, targetId, updateComment, onSuccess]);

  return { handleEditComment, isEditingComment: updateComment.isPending };
}
