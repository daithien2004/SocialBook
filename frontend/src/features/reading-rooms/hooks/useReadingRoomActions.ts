import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useModalStore } from '@/store/useModalStore';
import { useShallow } from 'zustand/react/shallow';
import { useCreatePost } from '@/features/posts/api/post.mutations';
import { useReactivateRoom } from '@/features/reading-rooms/api/reading-rooms.mutations';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

interface UseReadingRoomActionsOptions {
  roomCode: string;
  bookData?: { id: string; title: string; slug: string } | null;
  chapter?: { id: string; title: string } | null;
  leaveRoom: (newHostId?: string) => void;
  joinRoom: () => void;
}

export function useReadingRoomActions({
  roomCode,
  bookData,
  chapter,
  leaveRoom,
  joinRoom,
}: UseReadingRoomActionsOptions) {
  const router = useRouter();
  const { copy, copiedText } = useCopyToClipboard();
  const copied = !!copiedText;

  const { openConfirm, openAddToLibrary, openCreatePost } = useModalStore(
    useShallow((s) => ({
      openConfirm: s.openConfirm,
      openAddToLibrary: s.openAddToLibrary,
      openCreatePost: s.openCreatePost,
    })),
  );

  const createPost = useCreatePost();
  const reactivateRoom = useReactivateRoom();
  const isReactivating = reactivateRoom.isPending;

  const handleCopyCode = useCallback(() => {
    copy(roomCode, 'Đã sao chép mã phòng!');
  }, [copy, roomCode]);

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
          await createPost.mutateAsync({
            bookId: bookData.id,
            content: data.content,
            images: data.images,
          });
        } catch {
          /* silent */
        }
      },
    });
  }, [bookData, chapter, openCreatePost, createPost]);

  const handleTransferHost = useCallback(
    (newHostId?: string) => {
      leaveRoom(newHostId);
      router.push('/reading-rooms');
    },
    [leaveRoom, router],
  );

  const handleTransferHostClick = useCallback(
    (targetUser: { userId: string; displayName: string }) => {
      openConfirm({
        title: 'Chuyển quyền trưởng phòng?',
        description: `Bạn sắp chuyển quyền trưởng phòng cho ${targetUser.displayName}. LƯU Ý: Chuyển quyền xong bạn sẽ tự động rời khỏi phòng. Bạn có chắc chắn?`,
        confirmText: 'Xác nhận chuyển & Rời phòng',
        onConfirm: () => {
          leaveRoom(targetUser.userId);
          router.push('/reading-rooms');
        },
      });
    },
    [openConfirm, leaveRoom, router],
  );

  const handleReactivateRoom = useCallback(async () => {
    if (!roomCode) return;
    try {
      const result = await reactivateRoom.mutateAsync(roomCode);
      useReadingRoomStore.getState().setRoom(result);
      joinRoom();
      toast.success('Phòng đã được mở lại!');
      router.refresh();
    } catch {
      toast.error('Không thể mở lại phòng');
    }
  }, [joinRoom, reactivateRoom, roomCode, router]);

  const onAddToLibrary = useCallback(() => {
    if (bookData) {
      openAddToLibrary({ bookId: bookData.id });
    }
  }, [bookData, openAddToLibrary]);

  return {
    copied,
    isReactivating,
    handleCopyCode,
    handleShareRoom,
    handleTransferHost,
    handleTransferHostClick,
    handleReactivateRoom,
    onAddToLibrary,
  };
}
