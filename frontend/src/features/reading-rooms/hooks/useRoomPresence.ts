import { useEffect, useRef, useCallback } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

const KEEPALIVE_MS = 10_000;
const MIN_GAP_MS = 1_500;

export const useRoomPresence = (
  chapterSlug: string | undefined,
  sendHeartbeat: (slug: string, paraId?: string, progress?: number, bookId?: string, chapterId?: string) => void,
  activeParagraphId?: string | null,
  readingProgress?: number,
  bookId?: string,
  chapterId?: string,
) => {
  const connection = useReadingRoomStore((state) => state.connection);

  const latest = useRef({ chapterSlug, activeParagraphId, readingProgress, bookId, chapterId });
  
  useEffect(() => {
    latest.current = { chapterSlug, activeParagraphId, readingProgress, bookId, chapterId };
  });

  const sendNow = useCallback(() => {
    const { chapterSlug: c, activeParagraphId: p, readingProgress: pr, bookId: b, chapterId: ch } = latest.current;
    if (!c) return;
    sendHeartbeat(c, p || undefined, pr ? Math.round(pr * 100) / 100 : undefined, b, ch);
  }, [sendHeartbeat]);

  // Simple throttle with leading & trailing
  const throttleRef = useRef<{ timeout: NodeJS.Timeout | null, lastRan: number }>({ timeout: null, lastRan: 0 });

  const throttledSend = useCallback(() => {
    const now = Date.now();
    const { lastRan, timeout } = throttleRef.current;

    if (now - lastRan >= MIN_GAP_MS) {
      if (timeout) {
        clearTimeout(timeout);
        throttleRef.current.timeout = null;
      }
      sendNow();
      throttleRef.current.lastRan = now;
    } else {
      if (!timeout) {
        throttleRef.current.timeout = setTimeout(() => {
          sendNow();
          throttleRef.current.lastRan = Date.now();
          throttleRef.current.timeout = null;
        }, MIN_GAP_MS - (now - lastRan));
      }
    }
  }, [sendNow]);

  const cancelThrottle = useCallback(() => {
    if (throttleRef.current.timeout) {
      clearTimeout(throttleRef.current.timeout);
      throttleRef.current.timeout = null;
    }
  }, []);

  // 1) Emit on change (debounced)
  useEffect(() => {
    if (connection === 'joined' && chapterSlug) {
      throttledSend();
    }
    return () => cancelThrottle();
  }, [chapterSlug, activeParagraphId, connection, throttledSend, cancelThrottle]);

  // 2) Keepalive + visibility
  useEffect(() => {
    const tick = () => { 
      if (document.visibilityState === 'visible' && connection === 'joined') {
        sendNow(); 
      }
    };
    const id = setInterval(tick, KEEPALIVE_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { 
      clearInterval(id); 
      document.removeEventListener('visibilitychange', tick); 
    };
  }, [sendNow, connection]);
};
