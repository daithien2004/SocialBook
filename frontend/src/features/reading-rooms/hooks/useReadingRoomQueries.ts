import { useQuery } from '@tanstack/react-query';
import { readingRoomQueries } from '@/features/reading-rooms/api/reading-rooms.queries';
import { bookQueries } from '@/features/books/api/books.queries';
import { chaptersQueries } from '@/features/chapters/api/chapters.queries';
import { libraryQueries } from '@/features/library/api/library.queries';


interface UseReadingRoomQueriesOptions {
  roomCode: string;
  currentChapterSlug: string;
  isAuthenticated: boolean;
}

export function useReadingRoomQueries({
  roomCode,
  currentChapterSlug,
  isAuthenticated,
}: UseReadingRoomQueriesOptions) {
  const { data: initialRoom, isLoading: isLoadingRoom, error } = useQuery({
    ...readingRoomQueries.room(roomCode),
    enabled: isAuthenticated,
  });

  const bookId = initialRoom?.bookId;

  const { data: bookData } = useQuery({
    ...bookQueries.byId(bookId || ''),
    enabled: !!bookId,
  });

  const { data: chapterData, isPending: isLoadingChapter } = useQuery({
    ...chaptersQueries.detail({
      bookSlug: bookData?.slug || '',
      chapterSlug: currentChapterSlug,
    }),
    enabled: !!bookData?.slug && !!currentChapterSlug,
  });

  const { data: chaptersData } = useQuery({
    ...chaptersQueries.list({ bookSlug: bookData?.slug || '' }),
    enabled: !!bookData?.slug,
  });



  const { data: progressData } = useQuery({
    ...libraryQueries.chapterProgress({
      bookId: bookId || '',
      chapterId: chapterData?.chapter?.id || '',
    }),
    enabled: !!bookId && !!chapterData?.chapter?.id,
  });

  return {
    initialRoom,
    isLoadingRoom,
    error,
    bookData,
    chapterData,
    isLoadingChapter,
    chaptersData,
    progressData,
  };
}
