import { useQuery } from '@tanstack/react-query';
import { bookQueries } from '@/features/books/api/books.queries';
import { useLikeBook, useRecordView } from '@/features/books/api/books.mutations';
import { bookKeys } from '@/lib/query-keys';
import { useEffect, useRef, useMemo } from 'react';
import { useCreatePost } from '@/features/posts/api/post.mutations';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import { queryClient } from '@/lib/query-client';
import type { Book } from '../types/book.interface';

export const useBookDetail = (bookSlug: string) => {
  const { data: book, isLoading, error } = useQuery(bookQueries.detail(bookSlug));
  const { user } = useAppAuth();

  const likeBook = useLikeBook();
  const createPost = useCreatePost();
  const isCreatingPost = createPost.isPending;
  const recordView = useRecordView();
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (book?.slug && !hasRecordedView.current) {
      hasRecordedView.current = true;
      void recordView
        .mutateAsync(book.slug)
        .then(() => {
          queryClient.setQueryData<Book>(
            bookKeys.detail(book.slug),
            (draft) => {
              if (!draft) return draft;
              return {
                ...draft,
                stats: {
                  ...draft.stats,
                  views: (draft.stats?.views ?? 0) + 1,
                },
              };
            },
          );
        });
    }
  }, [book?.slug, recordView]);

  const isLiked =
    !user?.id || !book?.likedBy ? false : book.likedBy.includes(user.id);

  const likesCount = book?.stats?.likes ?? 0;

  const handleToggleLike = async () => {
    if (!book?.slug || !user?.id) return;
    try {
      const result = await likeBook.mutateAsync(book.slug);
      queryClient.setQueryData<Book>(
        bookKeys.detail(book.slug),
        (draft) => {
          if (!draft) return draft;
          const currentLikedBy = draft.likedBy || [];
          const newLikedBy = result.isLiked
            ? currentLikedBy.includes(user.id)
              ? currentLikedBy
              : [...currentLikedBy, user.id]
            : currentLikedBy.filter((id) => id !== user.id);

          return {
            ...draft,
            likedBy: newLikedBy,
            stats: {
              ...draft.stats,
              likes: result.likes,
            },
          };
        },
      );
    } catch {
      toast.error('Không thể thích sách này');
    }
  };

  const handleSharePost = async (data: { content: string; images: File[] }) => {
    if (!book?.id) return;
    try {
      const result = await createPost.mutateAsync({
        bookId: book.id,
        content: data.content,
        images: data.images,
      });

      if (result.warning) {
        toast.warning('Bài viết đang được xem xét', {
          description: result.warning,
          duration: 5000,
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
    const authorName = book.authorId?.name || 'Không rõ';
    const title = book.title || '';

    return `Mọi người ơi, mình vừa tìm thấy cuốn sách này hay cực: "${title}" của tác giả ${authorName}. 📖✨\n\nBạn nào mê đọc sách thì ghé qua SocialBook xem thử cùng mình nhé!`;
  }, [book]);

  return {
    book,
    isLoading,
    error,
    isLiked,
    likesCount,
    isLiking: likeBook.isPending,
    isCreatingPost,
    handleToggleLike,
    handleSharePost,
    defaultShareContent,
  };
};