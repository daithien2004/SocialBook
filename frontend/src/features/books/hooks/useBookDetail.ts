import { useGetBookBySlugQuery, useLikeBookMutation } from '@/features/books/api/bookApi';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { getErrorMessage } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';

export const useBookDetail = (bookSlug: string) => {
  const { data: book, isLoading, error } = useGetBookBySlugQuery({ bookSlug });
  const { user } = useAppAuth();

  const [likeBook, { isLoading: isLiking }] = useLikeBookMutation();
  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();

  // Derive initial isLiked and likesCount from the book data
  const derivedIsLiked = useMemo(() => {
    if (!user?.id || !book?.likedBy) return false;
    return book.likedBy.includes(user.id);
  }, [book?.likedBy, user?.id]);

  const derivedLikesCount = book?.stats?.likes ?? 0;

  // Use local state so the UI updates immediately from the API response
  const [isLiked, setIsLiked] = useState(derivedIsLiked);
  const [likesCount, setLikesCount] = useState(derivedLikesCount);

  // Sync local state when book data changes (e.g. on initial load)
  useEffect(() => {
    setIsLiked(derivedIsLiked);
  }, [derivedIsLiked]);

  useEffect(() => {
    setLikesCount(derivedLikesCount);
  }, [derivedLikesCount]);

  const handleToggleLike = async () => {
    if (!book?.id) return;
    try {
      const result = await likeBook(book.slug).unwrap();
      // Immediately update UI from the API response
      setIsLiked(result.isLiked);
      setLikesCount(result.likes);
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
    
    return `Mọi người ơi, mình vừa tìm thấy cuốn sách này hay cực: "${title}" của tác giả ${authorName}. 📖✨

Bạn nào mê đọc sách thì ghé qua SocialBook xem thử cùng mình nhé!

#SocialBook #${authorName.replace(/\s+/g, '')} #${title.replace(/\s+/g, '')}`;
  }, [book]);

  return {
    book,
    isLoading,
    error,
    isLiked,
    likesCount,
    isLiking,
    isCreatingPost,
    handleToggleLike,
    handleSharePost,
    defaultShareContent
  };
};