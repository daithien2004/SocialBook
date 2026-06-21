import { useEffect, useRef } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

export const useRoomPresence = (
  chapterSlug: string,
  sendHeartbeat: (slug: string, paraId?: string, progress?: number, bookId?: string, chapterId?: string) => void,
  activeParagraphId?: string | null,
  readingProgress?: number,
  bookId?: string,
  chapterId?: string,
) => {
  const room = useReadingRoomStore((state) => state.room);
  
  // Track the last time we actually fired the heartbeat to the socket
  const lastSentAt = useRef<number>(0);
  const pendingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!room) return;

    const emit = () => {
      sendHeartbeat(chapterSlug, activeParagraphId || undefined, readingProgress, bookId, chapterId);
      lastSentAt.current = Date.now();
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
        pendingTimeout.current = null;
      }
    };

    const now = Date.now();
    const timeSinceLast = now - lastSentAt.current;

    // Backend rate limit is 30 requests per minute = 1 req / 2000ms.
    // We use 2100ms to be safe and avoid silent drops.
    const THROTTLE_MS = 2100;

    if (timeSinceLast >= THROTTLE_MS) {
      emit();
    } else {
      // Schedule the emit for when the throttle window opens to ensure the LAST state is always sent
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
      pendingTimeout.current = setTimeout(emit, THROTTLE_MS - timeSinceLast);
    }

    // Background interval to keep presence alive when not interacting
    const interval = setInterval(() => {
      if (Date.now() - lastSentAt.current >= 9000) {
        emit();
      }
    }, 10_000);

    return () => {
      clearInterval(interval);
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    };
  }, [room, chapterSlug, activeParagraphId, readingProgress, sendHeartbeat]);
};
