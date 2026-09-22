import { useCallback, useState } from 'react';
import { useDeletePostImage, useDeletePost } from '@/features/posts/api/post.mutations';
import { useToggleLike } from '@/features/likes/api/like.mutations';
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

  const deletePostMutation = useDeletePost();
  const deleteImageMutation = useDeletePostImage();
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

  const deletePost = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deletePostMutation.mutateAsync(postId);
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
        await deleteImageMutation.mutateAsync({
          id: postId,
          imageUrl,
        });
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