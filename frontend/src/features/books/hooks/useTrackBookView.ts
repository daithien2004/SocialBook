import { useEffect, useRef } from 'react';
import { useRecordView } from '@/features/books/api/books.mutations';
import { bookKeys } from '@/lib/query-keys';
import { queryClient } from '@/lib/query-client';
import type { Book } from '../types/book.interface';

export function useTrackBookView(bookSlug?: string) {
  const recordView = useRecordView();
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (bookSlug && !hasRecordedView.current) {
      hasRecordedView.current = true;
      void recordView
        .mutateAsync(bookSlug)
        .then(() => {
          queryClient.setQueryData<Book>(
            bookKeys.detail(bookSlug),
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
  }, [bookSlug, recordView]);
}
