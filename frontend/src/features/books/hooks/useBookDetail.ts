'use client';

import { useGetBookBySlugQuery, useLikeBookMutation } from '@/features/books/api/bookApi';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { getErrorMessage } from '@/lib/utils';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useAppAuth } from '@/hooks/useAppAuth';

export const useBookDetail = (bookSlug: string) => {
  const { data: book, isLoading, error } = useGetBookBySlugQuery({ bookSlug });
  const { user } = useAppAuth();

  const [likeBook, { isLoading: isLiking }] = useLikeBookMutation();
  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();

  // Compute isLiked from the likedBy array + current user id
  const isLiked = useMemo(() => {
    if (!user?.id || !book?.likedBy) return false;
    return book.likedBy.includes(user.id);
  }, [book?.likedBy, user?.id]);

  const handleToggleLike = async () => {
    if (!book?.id) return;
    try {
      await likeBook(book.slug).unwrap();
    } catch (error: any) {
      if (error?.status !== 401) {
        toast.error('Không thể thích sách này');
      }
    }
  };

  const handleSharePost = async (data: { content: string; images: File[] }) => {
    if (!book?.id) return;
    try {
      const result = await createPost({
        bookId: book.id,
        content: data.content,
        images: data.images,
      }).unwrap();

      if (result.warning) {
        toast.warning('Bài viết đang được xem xét', {
          description: result.warning,
          duration: 5000
        });
      } else {
        toast.success('Chia sẻ thành công!');
      }
      return true;
    } catch (err: any) {
      if (err?.status !== 401) {
        toast.error(getErrorMessage(err));
      }
      return false;
    }
  };

  const defaultShareContent = useMemo(() => {
    if (!book || !book.title) return '';
    const authorName = book.authorId?.name || 'Không rõ';
    const title = book.title || '';
    const description = book.description || '';
    return `📚 ${title}
✍️ Tác giả: ${authorName}
⭐ Đánh giá: ${book.stats?.averageRating || 0}/5 (${book.stats?.totalRatings || 0} đánh giá)
👁️ ${book.stats?.views?.toLocaleString() || 0} lượt xem

${description}

#${title.replace(/\s+/g, '')} #${authorName.replace(/\s+/g, '')}`;
  }, [book]);

  return {
    book,
    isLoading,
    error,
    isLiked,
    isLiking,
    isCreatingPost,
    handleToggleLike,
    handleSharePost,
    defaultShareContent
  };
};