import { useCallback, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { useReadingRoomStore, PARTY_COLORS, RemoteSelection } from '@/store/useReadingRoomStore';
import { ReadingRoomClientEvent, ReadingRoomServerEvent } from '@/features/reading-rooms/types/reading-room.events';
import { getCharOffset } from '@/utils/char-offset';

interface CollaborativeSelectionOptions {
  /** The current room ID */
  roomId: string | null;
  /** The current user's ID — their own selection is sent but not rendered locally */
  currentUserId: string | undefined;
  /** Map of userId → index for stable color assignment */
  userColorMap: Map<string, number>;
}

/**
 * useCollaborativeSelection
 *
 * Wires up:
 * 1. Local mouseup → capture selection offset → debounced socket emit
 * 2. Remote 'party:remote_selection' socket event → update store
 * 3. Cleanup on unmount → emit party:selection_cleared
 *
 * Returns a ref-based handler to attach to paragraph containers.
 */
export function useCollaborativeSelection({
  roomId,
  currentUserId,
  userColorMap,
}: CollaborativeSelectionOptions) {
  const { getSocket } = useSocket();
  const socket = getSocket('/reading-rooms');
  const lastEmitRef = useRef<{ paragraphId: string; startOffset: number; endOffset: number } | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Register socket listener for remote selections ─────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleRemoteSelection = (data: {
      userId: string;
      displayName: string;
      avatarUrl: string;
      paragraphId: string | null;
      startOffset: number;
      endOffset: number;
    }) => {
      if (!data.userId || data.userId === currentUserId) return;

      if (!data.paragraphId) {
        // null paragraphId = clear signal
        useReadingRoomStore.getState().clearRemoteSelection(data.userId);
        return;
      }

      // Assign color index deterministically
      let colorIdx = userColorMap.get(data.userId);
      if (colorIdx === undefined) {
        colorIdx = userColorMap.size % PARTY_COLORS.length;
        userColorMap.set(data.userId, colorIdx);
      }

      const selection: RemoteSelection = {
        userId: data.userId,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        paragraphId: data.paragraphId,
        startOffset: data.startOffset,
        endOffset: data.endOffset,
        colorIndex: colorIdx,
      };

      useReadingRoomStore.getState().setRemoteSelection(selection);
    };

    socket.on(ReadingRoomServerEvent.PARTY_REMOTE_SELECTION, handleRemoteSelection);

    return () => {
      socket.off(ReadingRoomServerEvent.PARTY_REMOTE_SELECTION, handleRemoteSelection);
      // Notify others that we've cleared our selection
      if (roomId) {
        socket.emit(ReadingRoomClientEvent.PARTY_SELECTION_CLEARED, { roomId });
      }
    };
  }, [socket, roomId, currentUserId, userColorMap]);

  // ── Mouseup handler to emit local selection ────────────────────────
  const handleParagraphMouseUp = useCallback(
    (paragraphId: string, containerEl: HTMLElement) => {
      if (!socket?.connected || !roomId) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim().length < 3) {
        // Empty selection → clear
        if (lastEmitRef.current !== null) {
          lastEmitRef.current = null;
          socket.emit(ReadingRoomClientEvent.PARTY_SELECTION_CLEARED, { roomId });
        }
        return;
      }

      const range = sel.getRangeAt(0);
      const offsets = getCharOffset(containerEl, range);
      if (!offsets) return;

      const { startOffset, endOffset } = offsets;

      // Deduplicate — only emit if something changed
      const prev = lastEmitRef.current;
      if (
        prev &&
        prev.paragraphId === paragraphId &&
        prev.startOffset === startOffset &&
        prev.endOffset === endOffset
      ) {
        return;
      }

      // Debounce 100ms
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        lastEmitRef.current = { paragraphId, startOffset, endOffset };
        socket.emit(ReadingRoomClientEvent.PARTY_SELECTION_UPDATE, {
          roomId,
          paragraphId,
          startOffset,
          endOffset,
        });
      }, 100);
    },
    [socket, roomId],
  );

  return { handleParagraphMouseUp };
}
