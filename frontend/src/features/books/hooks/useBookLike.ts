import { useLikeBook } from '@/features/books/api/books.mutations';
import { bookKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import { queryClient } from '@/lib/query-client';
import type { Book } from '../types/book.interface';

export function useBookLike(book?: Book | null) {
  const { user } = useAppAuth();
  const likeBook = useLikeBook();

  const isLiked = !user?.id || !book?.likedBy ? false : book.likedBy.includes(user.id);
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

  return {
    isLiked,
    likesCount,
    isLiking: likeBook.isPending,
    handleToggleLike,
  };
}
