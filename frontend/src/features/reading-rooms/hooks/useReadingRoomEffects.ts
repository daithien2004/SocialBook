import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import type { RoomResponse } from '@/features/reading-rooms/api/reading-rooms.api';

interface UseReadingRoomEffectsOptions {
  quotesData: unknown;
  isEnded: boolean;
  initialRoom: RoomResponse | undefined;
  chapterId: string | undefined;
  savedProgress: number;
}

export function useReadingRoomEffects({
  quotesData,
  isEnded,
  initialRoom,
  chapterId,
  savedProgress,
}: UseReadingRoomEffectsOptions) {
  const quotesSeededRef = useRef(false);
  
  useEffect(() => {
    if (quotesData && !quotesSeededRef.current) {
      quotesSeededRef.current = true;
      useReadingRoomStore.getState().setQuotes(quotesData as never);
    }
  }, [quotesData]);

  useEffect(() => {
    if (isEnded && initialRoom) {
      useReadingRoomStore.getState().setRoom({
        ...initialRoom,
        highlights: initialRoom.highlights || [],
        chatMessages: initialRoom.chatMessages || [],
      });
    }
  }, [isEnded, initialRoom]);

  useEffect(() => {
    if (chapterId && savedProgress > 0 && savedProgress < 100) {
      const t = setTimeout(() => {
        toast('Tiếp tục từ vị trí cũ?', {
          description: `Bạn đã đọc đến ${savedProgress}% chương này`,
          action: {
            label: 'Tiếp tục',
            onClick: () => {
              const docHeight =
                document.documentElement.scrollHeight - window.innerHeight;
              const targetScrollY = (savedProgress / 100) * docHeight;
              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
            },
          },
          duration: 8000,
        });
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [chapterId, savedProgress]);
}
