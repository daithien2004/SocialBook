'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useCreatePost } from '@/features/posts/api/post.mutations';
import { useModalStore } from '@/store/useModalStore';
import { getErrorMessage } from '@/lib/utils';

interface Paragraph {
  id: string;
  content: string;
}

export function useQuoteShare(bookId: string, bookTitle?: string) {
  const openCreatePost = useModalStore((s) => s.openCreatePost);
  const createPost = useCreatePost();

  const shareQuote = useCallback(
    (paragraph: Paragraph) => {
      openCreatePost({
        title: `Chia sẻ trích dẫn${bookTitle ? ` từ "${bookTitle}"` : ''}`,
        contentPlaceholder: 'Nội dung trích dẫn...',
        defaultContent: paragraph.content,
        defaultBookId: bookId,
        defaultBookTitle: bookTitle,
        onSubmit: async (data) => {
          if (!bookId) {
            toast.error('Không tìm thấy thông tin sách');
            return;
          }
          try {
            const result = await createPost.mutateAsync({
              bookId: bookId,
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
          } catch (error: unknown) {
            toast.error(getErrorMessage(error));
          }
        },
      });
    },
    [bookId, bookTitle, openCreatePost, createPost],
  );

  return { shareQuote };
}
