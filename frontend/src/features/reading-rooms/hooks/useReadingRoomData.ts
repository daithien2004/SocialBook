'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useAppAuth } from '@/features/auth/hooks';
import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { useRoomPresence } from '@/features/reading-rooms/hooks/useRoomPresence';
import { useReadingProgress } from '@/features/reading-rooms/hooks/useReadingProgress';
import { useReadingRoomNavigation } from '@/features/reading-rooms/hooks/useReadingRoomNavigation';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useModalStore } from '@/store/useModalStore';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useReadingView } from '@/features/books/hooks';
import { readingRoomQueries } from '@/features/reading-rooms/api/reading-rooms.queries';
import { useReactivateRoom } from '@/features/reading-rooms/api/reading-rooms.mutations';
import { bookQueries } from '@/features/books/api/books.queries';
import { chaptersQueries } from '@/features/chapters/api/chapters.queries';
import { libraryQueries } from '@/features/library/api/library.queries';
import { roomInteractionQueries } from '@/features/reading-room-interactions/api/room-interactions.queries';
import { useCreatePost } from '@/features/posts/api/post.mutations';

export function useReadingRoomData(roomCode: string) {
  // ── Shared utilities ──
  const router = useRouter();
  const searchParams = useSearchParams();
  const { copy, copiedText } = useCopyToClipboard();
  const copied = !!copiedText;
  const { openConfirm, openAddToLibrary, openCreatePost } = useModalStore();

  // ── Auth ──
  const { user, isAuthenticated } = useAppAuth();

  // ── Room data (React Query) ──
  const { data: initialRoom, isLoading: isLoadingRoom, error } = useQuery({
    ...readingRoomQueries.room(roomCode),
    enabled: isAuthenticated,
  });

  // ── Socket connection ──
  const shouldConnectSocket = isAuthenticated && !!initialRoom;
  const { endRoom, deleteRoom, leaveRoom, changeChapter, changeMode, sendHeartbeat, sendChatMessage } = useReadingRoomSocket(shouldConnectSocket ? roomCode : undefined);
  const reactivateRoom = useReactivateRoom();
  const isReactivating = reactivateRoom.isPending;

  // ── Derived state ──
  const storeRoom = useReadingRoomStore(state => state.room);
  const room = storeRoom || initialRoom;
  const isEnded = room?.status === 'ended';
  const isHost = room?.hostId === user?.id;
  const presences = useReadingRoomStore(state => state.presences);
  const currentChapterSlug = !isEnded && room?.mode === 'sync'
    ? room?.currentChapterSlug || ''
    : (searchParams.get('chapter') || room?.currentChapterSlug || '');

  // ── Book / Chapter queries ──
  const { data: bookData } = useQuery({
    ...bookQueries.byId(room?.bookId || ''),
    enabled: !!room?.bookId,
  });
  const { data: chapterData, isLoading: isLoadingChapter } = useQuery({
    ...chaptersQueries.detail({ bookSlug: bookData?.slug || '', chapterSlug: currentChapterSlug }),
    enabled: !!bookData?.slug && !!currentChapterSlug,
  });
  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;
  const { data: chaptersData } = useQuery({
    ...chaptersQueries.list({ bookSlug: bookData?.slug || '' }),
    enabled: !!bookData?.slug,
  });
  const { data: quotesData } = useQuery({
    ...roomInteractionQueries.quotes({ code: roomCode }),
    enabled: !!room,
  });

  // ── Progress query ──
  const { data: progressData } = useQuery({
    ...libraryQueries.chapterProgress({
      bookId: bookData?.id || '',
      chapterId: chapter?.id || '',
    }),
    enabled: !!bookData?.id && !!chapter?.id,
  });
  const savedProgress = progressData?.progress || 0;

  // ── UI state ──
  const [transferHostOpen, setTransferHostOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const { isControlsVisible, showSettings, setShowSettings } = useReadingView();

  // ── Sub-hooks ──
  const { readingProgress, readingParagraphId, contentRef, onActiveParagraphChange } = useReadingProgress();
  const { navigateChapter } = useReadingRoomNavigation({ roomCode, isEnded, roomMode: room?.mode, isHost });
  const createPost = useCreatePost();

  // ── Effects: quotes sync ──
  const quotesSeededRef = useRef(false);
  useEffect(() => {
    if (quotesData && !quotesSeededRef.current) {
      quotesSeededRef.current = true;
      useReadingRoomStore.getState().setQuotes(quotesData);
    }
  }, [quotesData]);

  // ── Effects: restore room if ended ──
  useEffect(() => {
    if (isEnded && initialRoom) {
      useReadingRoomStore.getState().setRoom({
        ...initialRoom,
        highlights: initialRoom.highlights || [],
        chatMessages: initialRoom.chatMessages || [],
      });
    }
  }, [isEnded, initialRoom]);

  // ── Effects: resume progress toast ──
  const resumeAskedRef = useRef(false);
  useEffect(() => {
    if (!chapter?.id || savedProgress <= 0 || savedProgress >= 100) return;
    if (resumeAskedRef.current) return;
    resumeAskedRef.current = true;

    toast('Tiếp tục từ vị trí cũ?', {
      description: `Bạn đã đọc đến ${savedProgress}% chương này`,
      action: {
        label: 'Tiếp tục',
        onClick: () => {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const targetScrollY = (savedProgress / 100) * docHeight;
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        },
      },
      duration: 8000,
    });
  }, [chapter?.id, savedProgress]);

  // ── Presence heartbeat (side-effect hook) ──
  useRoomPresence(currentChapterSlug || 'unknown', sendHeartbeat, readingParagraphId, readingProgress, bookData?.id, chapter?.id);

  // ── Handlers: room actions ──
  const handleCopyCode = useCallback(() => {
    copy(roomCode, 'Đã sao chép mã phòng!');
  }, [copy, roomCode]);

  const handleChapterNav = useCallback((slug: string) => {
    navigateChapter(slug, bookData?.id, changeChapter);
  }, [navigateChapter, bookData?.id, changeChapter]);

  const handleShareRoom = useCallback(() => {
    if (!bookData || !chapter) return;
    openCreatePost({
      title: `Chia sẻ "${chapter.title}"`,
      contentPlaceholder: 'Hãy chia sẻ cảm nghĩ của bạn về chương này...',
      defaultContent: `📖 Đang đọc cùng nhóm: ${bookData.title} - ${chapter.title}`,
      defaultBookId: bookData.id,
      defaultBookTitle: bookData.title,
      onSubmit: async (data) => {
        if (!bookData?.id) return;
        try {
          await createPost.mutateAsync({ bookId: bookData.id, content: data.content, images: data.images });
        } catch { /* silent */ }
      },
    });
  }, [bookData, chapter, openCreatePost, createPost]);

  const handleTransferHost = useCallback((newHostId?: string) => {
    leaveRoom(newHostId);
    router.push('/reading-rooms');
  }, [leaveRoom, router]);

  const handleTransferHostClick = useCallback((targetUser: { userId: string; displayName: string }) => {
    openConfirm({
      title: 'Chuyển quyền trưởng phòng?',
      description: `Bạn sắp chuyển quyền trưởng phòng cho ${targetUser.displayName}. LƯU Ý: Chuyển quyền xong bạn sẽ tự động rời khỏi phòng. Bạn có chắc chắn?`,
      confirmText: 'Xác nhận chuyển & Rời phòng',
      onConfirm: () => {
        leaveRoom(targetUser.userId);
        router.push('/reading-rooms');
      },
    });
  }, [openConfirm, leaveRoom, router]);

  const handleReactivateRoom = useCallback(async () => {
    if (!roomCode) return;
    try {
      const result = await reactivateRoom.mutateAsync(roomCode);
      useReadingRoomStore.getState().setRoom(result);
      toast.success('Phòng đã được mở lại!');
      router.refresh();
    } catch {
      toast.error('Không thể mở lại phòng');
    }
  }, [reactivateRoom, roomCode, router]);

  const onAddToLibrary = useCallback(() => {
    if (bookData) {
      openAddToLibrary({ bookId: bookData.id });
    }
  }, [bookData, openAddToLibrary]);

  // ── Return ──
  return {
    // Auth
    isAuthenticated, user,
    // Room
    room, initialRoom, isEnded, isHost, presences, copied, currentChapterSlug,
    // Book / Chapter
    bookData, chapter, navigation, chaptersData,
    // Loading
    isLoadingRoom, isLoadingChapter, isReactivating, error,
    // Reading
    readingProgress, readingParagraphId, contentRef, onActiveParagraphChange,
    // UI toggles
    isControlsVisible, showSettings, setShowSettings,
    showBookmarks, setShowBookmarks, showTOC, setShowTOC,
    showHighlights, setShowHighlights,
    showMobileSidebar, setShowMobileSidebar, transferHostOpen, setTransferHostOpen,
    // Socket actions
    sendChatMessage, changeMode, endRoom, deleteRoom,
    // Room actions
    savedProgress, handleReactivateRoom,
    // Handlers
    handleTransferHost, handleTransferHostClick,
    handleChapterNav, handleShareRoom, handleCopyCode, onAddToLibrary,
  };
}
