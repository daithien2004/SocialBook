import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppAuth } from '@/features/auth/hooks';
import { useReadingRoomStore, PresenceData, RoomHighlight } from '@/store/useReadingRoomStore';
import { queryClient } from '@/lib/query-client';
import { readingRoomsKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { z } from 'zod';
import type { RoomResponse } from '@/features/reading-rooms/api/reading-rooms.api';
import { ReadingRoomServerEvent, ReadingRoomClientEvent } from '../types/reading-room.events';
import { useSocketEvents } from '@/hooks/useSocketEvents';

const presenceSchema = z.object({
  userId: z.string(),
  displayName: z.string().max(80),
  avatarUrl: z.string().nullish().optional(),
  currentChapterSlug: z.string().max(200),
  paragraphId: z.string().max(100).nullable().optional(),
  progress: z.number().min(0).max(1).optional(),
});
const presenceListSchema = z.array(presenceSchema).max(500);

type JoinAck = { ok: true; snapshot: { presences: PresenceData[]; room?: RoomResponse; members?: { userId: string; role: string }[] } } | { ok: false; code: 'NOT_FOUND' | 'FULL' | 'FORBIDDEN' | 'UNAUTHORIZED' };

type ReadingRoomServerEvents = {
  'connect': void;
  'disconnect': unknown;
  'connect_error': void;
  [ReadingRoomServerEvent.PRESENCE_UPDATE]: unknown; // Raw array string/object from socket
  [ReadingRoomServerEvent.MEMBER_JOINED]: { userId: string };
  [ReadingRoomServerEvent.MEMBER_LEFT]: { userId: string };
  [ReadingRoomServerEvent.HOST_CHANGED]: { newHostId: string };
  [ReadingRoomServerEvent.CHAPTER_CHANGED]: { chapterSlug: string };
  [ReadingRoomServerEvent.MODE_CHANGED]: { mode: 'sync' | 'free'; changedBy?: string };
  [ReadingRoomServerEvent.ROOM_ENDED]: { endedBy: string };
  [ReadingRoomServerEvent.ERROR]: { message?: string };
  [ReadingRoomServerEvent.NEW_HIGHLIGHT]: RoomHighlight;
  [ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT]: { highlightId: string; insight: string };
  [ReadingRoomServerEvent.HIGHLIGHT_REMOVED]: { highlightId: string };
};

const invalidateRoomCache = (code: string): void => {
  void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myActive() });
  void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myHistory() });
  void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.room(code) });
};

export function useReadingRoomSocket(roomCode?: string) {
  const userId = useAppAuth().user?.id;
  const router = useRouter();
  const { getSocket, acquireSocket, releaseSocket } = useSocket();
  const socket = useMemo(() => getSocket('/reading-rooms'), [getSocket]);

  const sendHeartbeat = useCallback(
    (chapterSlug: string, paragraphId?: string, progress?: number, bookId?: string, chapterId?: string) => {
      if (useReadingRoomStore.getState().connection !== 'joined') return;
      socket.volatile.emit(ReadingRoomClientEvent.HEARTBEAT, {
        roomId: roomCode, // Backend might expect roomId or roomCode based on old code, sending roomId mapping to roomCode for compatibility but standardizing
        roomCode,
        chapterSlug,
        paragraphId: paragraphId || null,
        progress,
        bookId,
        chapterId,
      });
    },
    [socket, roomCode],
  );

  const addHighlight = useCallback((data: { chapterSlug: string; paragraphId: string; content: string }) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.ADD_HIGHLIGHT, { roomId: store.room.roomId, ...data });
    }
  }, [socket]);

  const removeHighlight = useCallback((highlightId: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.REMOVE_HIGHLIGHT, { roomId: store.room.roomId, highlightId });
    }
  }, [socket]);

  const changeChapter = useCallback((chapterSlug: string, bookId?: string, chapterId?: string) => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.CHAPTER_CHANGE, { roomId: store.room.roomId, chapterSlug, bookId, chapterId });
    }
  }, [socket]);

  const endRoom = useCallback(() => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.END_ROOM, { roomId: store.room.roomId });
    }
  }, [socket]);

  const leaveRoom = useCallback((newHostId?: string) => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, { roomId: store.room.roomId, ...(newHostId && { newHostId }) });
      useReadingRoomStore.getState().clearRoom();
    }
  }, [socket]);



  const generateHighlightInsight = useCallback((highlightId: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.GENERATE_HIGHLIGHT_INSIGHT, { roomId: store.room.roomId, highlightId });
    }
  }, [socket]);

  const changeMode = useCallback((newMode: 'sync' | 'free') => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.CHANGE_MODE, { roomId: store.room.roomId, mode: newMode });
    }
  }, [socket]);

  const activeRef = useRef(true);

  // Mapped listeners
  const join = useCallback(() => {
    const store = useReadingRoomStore.getState();
    store.setConnection('joining');
    socket.timeout(5000).emit(ReadingRoomClientEvent.JOIN_ROOM, { roomCode }, (err: Error | null, ack?: JoinAck) => {
      if (!activeRef.current) return;
      if (err || !ack) {
        return store.setConnection('error', 'TIMEOUT');
      }
      if (!ack.ok) return store.setConnection('error', ack.code);
      store.hydrate(ack.snapshot);
      if (ack.snapshot.room) store.setRoom(ack.snapshot.room);
      if (ack.snapshot.members) store.setMembers(ack.snapshot.members);
      store.setConnection('joined');
    });
  }, [roomCode, socket]);

  useSocketEvents<ReadingRoomServerEvents>(socket, {
    'connect': join,
    'disconnect': (reason) => {
      if (reason !== 'io client disconnect') useReadingRoomStore.getState().setConnection('reconnecting');
    },
    'connect_error': () => useReadingRoomStore.getState().setConnection('reconnecting'),
    [ReadingRoomServerEvent.PRESENCE_UPDATE]: (raw) => {
      const r = presenceListSchema.safeParse(raw);
      if (!r.success) {
         console.error('PRESENCE_UPDATE invalid', r.error);
         return;
      }
      useReadingRoomStore.getState().updatePresences(r.data as PresenceData[]);
    },
    [ReadingRoomServerEvent.MEMBER_JOINED]: (payload) => {
      if (payload.userId === userId) return;
      useReadingRoomStore.getState().addMember(payload.userId);
    },
    [ReadingRoomServerEvent.MEMBER_LEFT]: (payload) => useReadingRoomStore.getState().removeMember(payload.userId),
    [ReadingRoomServerEvent.HOST_CHANGED]: (payload) => {
      const s = useReadingRoomStore.getState();
      if (s.room) s.setRoom({ ...s.room, hostId: payload.newHostId });
      if (payload.newHostId === userId) toast.success('Bạn đã trở thành trưởng phòng mới!');
    },
    [ReadingRoomServerEvent.CHAPTER_CHANGED]: (payload) => {
      useReadingRoomStore.getState().updateChapter(payload.chapterSlug);
    },
    [ReadingRoomServerEvent.MODE_CHANGED]: (payload) => {
      const s = useReadingRoomStore.getState();
      if (s.room) s.setRoom({ ...s.room, mode: payload.mode });
      if (payload.changedBy === 'system') {
        toast.info(
          payload.mode === 'free'
            ? 'Phòng đã chuyển sang chế độ tự do do trưởng phòng rời đi'
            : 'Chế độ phòng đã thay đổi',
        );
      }
    },
    [ReadingRoomServerEvent.ROOM_ENDED]: (payload) => {
      if (payload.endedBy !== userId) toast.info('Phòng đọc đã kết thúc');
      useReadingRoomStore.getState().clearRoom();
      invalidateRoomCache(roomCode || '');
      router.refresh();
    },
    [ReadingRoomServerEvent.ERROR]: (payload) => {
      if (payload.message?.includes('ended') && useReadingRoomStore.getState().room?.status === 'ended') return;
      toast.error(payload.message || 'Lỗi kết nối phòng đọc');
    },
    [ReadingRoomServerEvent.NEW_HIGHLIGHT]: (payload) => {
      useReadingRoomStore.getState().addHighlight(payload);
    },
    [ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT]: (payload) => {
      useReadingRoomStore.getState().updateHighlightInsight(payload.highlightId, payload.insight);
    },
    [ReadingRoomServerEvent.HIGHLIGHT_REMOVED]: (payload) => {
      useReadingRoomStore.getState().removeHighlight(payload.highlightId);
    },
  });

  useEffect(() => {
    if (!roomCode || !userId) return;
    const store = useReadingRoomStore.getState();
    activeRef.current = true;

    store.setConnection('connecting');
    acquireSocket('/reading-rooms');
    if (socket.connected) join();

    return () => {
      activeRef.current = false;
      if (socket.connected) {
          socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, { roomId: roomCode, roomCode });
      }
      useReadingRoomStore.getState().clearRoom();
      releaseSocket('/reading-rooms');
    };
  }, [roomCode, userId, socket, acquireSocket, releaseSocket, join]);

  return {
    socket, changeChapter, changeMode, endRoom, leaveRoom, sendHeartbeat,
    addHighlight, removeHighlight, generateHighlightInsight
  };
}