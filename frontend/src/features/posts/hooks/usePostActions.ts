import { useCallback, useEffect, useState } from 'react';
import { useDeletePostImageMutation, useDeletePostMutation } from '@/features/posts/api/postApi';
import { usePostToggleLikeMutation } from '@/features/likes/api/likeApi';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

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
  
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialLikeStatus);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setIsLiked(initialLikeStatus);
  }, [postId, initialLikeCount, initialLikeStatus]);

  const [deletePostMutation] = useDeletePostMutation();
  const [deleteImageMutation] = useDeletePostImageMutation();
  const [toggleLikeMutation] = usePostToggleLikeMutation();

  const toggleLike = useCallback(async () => {
    const nextLiked = !isLiked;
    
    // Optimistic update
    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleLikeMutation({
        targetId: postId,
        targetType: 'post',
      }).unwrap();
    } catch (error) {
      // Rollback on error
      setIsLiked(!nextLiked);
      setLikeCount((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
      console.log('Toggle like failed:', error);
    }
  }, [isLiked, postId, toggleLikeMutation]);

  const deletePost = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deletePostMutation(postId).unwrap();
      toast.success('Xóa bài viết thành công!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      if ((error as { status?: number })?.status !== 401) {
        toast.error(getErrorMessage(error));
      }
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
        toast.success('Xóa ảnh thành công!');
      } catch (error) {
        console.error('Failed to delete image:', error);
        if ((error as { status?: number })?.status !== 401) {
          toast.error(getErrorMessage(error));
        }
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
