import { useGetBookBySlugQuery, useLikeBookMutation, useRecordViewMutation, booksApi } from '@/features/books/api/bookApi';
import { useEffect, useRef } from 'react';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { getErrorMessage } from '@/lib/utils';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import { useAppDispatch } from '@/store/hooks';

export const useBookDetail = (bookSlug: string) => {
  const { data: book, isLoading, error } = useGetBookBySlugQuery({ bookSlug });
  const { user } = useAppAuth();
  const dispatch = useAppDispatch();

  const [likeBook, { isLoading: isLiking }] = useLikeBookMutation();
  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();
  const [recordView] = useRecordViewMutation();
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (book?.slug && !hasRecordedView.current) {
      hasRecordedView.current = true;
      recordView(book.slug).unwrap().then(() => {
        dispatch(
          booksApi.util.updateQueryData('getBookBySlug', { bookSlug: book.slug }, (draft) => {
            if (draft.stats) {
              draft.stats.views += 1;
            }
          }),
        );
      });
    }
  }, [book?.slug, recordView, dispatch]);

  const isLiked = !user?.id || !book?.likedBy ? false : book.likedBy.includes(user.id);

  const likesCount = book?.stats?.likes ?? 0;

  const handleToggleLike = async () => {
    if (!book?.slug || !user?.id) return;
    try {
      const result = await likeBook(book.slug).unwrap();
      dispatch(
        booksApi.util.updateQueryData('getBookBySlug', { bookSlug: book.slug }, (draft) => {
          if (result.isLiked) {
            if (!draft.likedBy.includes(user.id)) {
              draft.likedBy.push(user.id);
            }
          } else {
            draft.likedBy = draft.likedBy.filter((id) => id !== user.id);
          }
          if (draft.stats) {
            draft.stats.likes = result.likes;
          }
        }),
      );
    } catch {
      toast.error('Không thể thích sách này');
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
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const defaultShareContent = useMemo(() => {
    if (!book || !book.title) return '';
    const authorName = book.authorId.name || 'Không rõ';
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