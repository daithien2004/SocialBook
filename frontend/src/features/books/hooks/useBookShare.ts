import { useMemo } from 'react';
import { useCreatePost } from '@/features/posts/api/post.mutations';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import type { Book } from '../types/book.interface';

export function useBookShare(book?: Book | null) {
  const createPost = useCreatePost();
  const isCreatingPost = createPost.isPending;

  const handleSharePost = async (data: { content: string; images: File[] }) => {
    if (!book?.id) return false;
    try {
      const result = await createPost.mutateAsync({
        bookId: book.id,
        content: data.content,
        images: data.images,
      });

      if (result.warnings?.[0]) {
        toast.warning('Bài viết đang được xem xét', {
          description: result.warnings?.[0],
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
    isCreatingPost,
    handleSharePost,
    defaultShareContent,
  };
}
