import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkKeys } from '@/lib/query-keys';
import { createBookmark, deleteBookmark } from './bookmark.api';
import type {
  Bookmark,
  CreateBookmarkRequest,
} from '@/features/bookmarks/schemas/bookmark.schema';

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation<Bookmark, Error, CreateBookmarkRequest>({
    mutationFn: createBookmark,
    onSuccess: (_data, request) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkKeys.byBook(request.bookId),
      });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { paragraphId: string; bookId: string }>({
    mutationFn: ({ paragraphId }) => deleteBookmark(paragraphId),
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkKeys.byBook(bookId),
      });
    },
  });
}