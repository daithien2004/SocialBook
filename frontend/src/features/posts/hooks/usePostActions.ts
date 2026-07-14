import { useCallback, useState } from 'react';
import { useDeletePostImageMutation, useDeletePostMutation } from '@/features/posts/api/postApi';
import { usePostToggleLikeMutation } from '@/features/likes/api/likeApi';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useOptimisticToggle } from '@/hooks/useOptimisticToggle';
import { MESSAGES } from '@/constants/messages';

interface UsePostActionsOptions {
  postId: string;
  initialLikeCount?: number;
  initialLikeStatus?: boolean;
}

interface UsePostActionsReturn {
  likeCount: number;
  isLiked: boolean;
  isDeleting: boolean;
  toggleLike: () => Promise<void>;
  deletePost: () => Promise<void>;
  deleteImage: (imageUrl: string) => Promise<void>;
}

export function usePostActions(options: UsePostActionsOptions): UsePostActionsReturn {
  const { postId, initialLikeCount = 0, initialLikeStatus = false } = options;
  
  const [isDeleting, setIsDeleting] = useState(false);

  const [deletePostMutation] = useDeletePostMutation();
  const [deleteImageMutation] = useDeletePostImageMutation();
  const [toggleLikeMutation] = usePostToggleLikeMutation();

  const {
    count: likeCount,
    isActive: isLiked,
    toggle: toggleLike,
  } = useOptimisticToggle({
    initialCount: initialLikeCount,
    initialState: initialLikeStatus,
    onToggle: () => toggleLikeMutation({ targetId: postId, targetType: 'post' }).unwrap(),
  });

  const deletePost = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deletePostMutation(postId).unwrap();
      toast.success(MESSAGES.POST_DELETE_SUCCESS);
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [deletePostMutation, postId]);

  const deleteImage = useCallback(
    async (imageUrl: string) => {
      try {
        await deleteImageMutation({
          id: postId,
          data: { imageUrl },
        }).unwrap();
        toast.success(MESSAGES.POST_IMAGE_DELETE_SUCCESS);
      } catch (error) {
        toast.error(getErrorMessage(error));
        throw error;
      }
    },
    [deleteImageMutation, postId]
  );

  return {
    likeCount,
    isLiked,
    isDeleting,
    toggleLike,
    deletePost,
    deleteImage,
  };
}
