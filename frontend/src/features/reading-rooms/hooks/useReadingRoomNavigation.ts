'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationDeps {
  roomCode: string;
  isEnded: boolean;
  roomMode: 'sync' | 'free' | undefined;
  isHost: boolean;
}

export function useReadingRoomNavigation(deps: NavigationDeps) {
  const router = useRouter();
  const { roomCode, isEnded, roomMode, isHost } = deps;

  const navigateChapter = useCallback(
    (slug: string, bookId?: string) => {
      if (!isEnded && roomMode === 'sync' && !isHost) {
        return { blocked: true as const };
      }
      if (!(!isEnded && roomMode === 'sync' && isHost)) {
        router.push(`/reading-rooms/${roomCode}?chapter=${slug}`);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      return { blocked: false as const };
    },
    [roomCode, isEnded, roomMode, isHost, router],
  );

  return { navigateChapter };
}
