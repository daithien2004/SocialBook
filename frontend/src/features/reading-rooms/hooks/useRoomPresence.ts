import { useEffect } from 'react';
import { useReadingRoomSocket } from './useReadingRoomSocket';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

export const useRoomPresence = (chapterSlug: string, activeParagraphId?: string | null, sendHeartbeat?: (slug: string, paraId?: string) => void) => {
  const { sendHeartbeat: hookHeartbeat } = useReadingRoomSocket();
  const actualSendHeartbeat = sendHeartbeat || hookHeartbeat;
  const room = useReadingRoomStore((state) => state.room);

  // Send heartbeat every 10 seconds. Redis presence TTL is 30s, so this
  // provides a 3× safety margin before a user appears offline.
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      actualSendHeartbeat(chapterSlug, activeParagraphId || undefined);
    }, 10_000);

    // Send immediate heartbeat on change
    actualSendHeartbeat(chapterSlug, activeParagraphId || undefined);

    return () => clearInterval(interval);
  }, [room?.roomId, chapterSlug, activeParagraphId, actualSendHeartbeat]);
};
