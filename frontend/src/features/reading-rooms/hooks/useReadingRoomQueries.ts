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
  const {
    data: initialRoom,
    isLoading: isLoadingRoom,
    error,
  } = useQuery({
    ...readingRoomQueries.room(roomCode),
    enabled: isAuthenticated,
  });

  const bookId = initialRoom?.bookId;
  const isActiveRoomMember =
    initialRoom !== undefined &&
    'members' in initialRoom &&
    initialRoom.status === 'active';
  const useRoomChapter =
    isActiveRoomMember &&
    (initialRoom.mode === 'sync' ||
      currentChapterSlug === initialRoom.currentChapterSlug);

  const { data: regularBookData } = useQuery({
    ...bookQueries.byId(bookId || ''),
    enabled: !!bookId && !useRoomChapter,
  });

  const { data: roomChapterData, isPending: isRoomChapterPending } = useQuery({
    ...readingRoomQueries.currentChapter(roomCode, currentChapterSlug),
    enabled: isAuthenticated && useRoomChapter,
  });

  const { data: regularChapterData, isPending: isRegularChapterPending } =
    useQuery({
      ...chaptersQueries.detail({
        bookSlug: regularBookData?.slug || '',
        chapterSlug: currentChapterSlug,
      }),
      enabled:
        !useRoomChapter && !!regularBookData?.slug && !!currentChapterSlug,
    });

  const bookData = roomChapterData?.book ?? regularBookData;
  const chapterData = roomChapterData ?? regularChapterData;
  const isLoadingChapter = useRoomChapter
    ? isRoomChapterPending
    : isRegularChapterPending;

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
