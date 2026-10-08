import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppAuth } from '@/features/auth/hooks';
import {
  useReadingRoomStore,
  PresenceData,
  PresenceChange,
  RoomHighlight,
} from '@/store/useReadingRoomStore';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketProvider';
import { z } from 'zod';
import type { RoomResponse } from '@/features/reading-rooms/api/reading-rooms.api';
import {
  ReadingRoomServerEvent,
  ReadingRoomClientEvent,
} from '../types/reading-room.events';
import { useSocketEvents } from '@/hooks/useSocketEvents';

const presenceSchema = z.object({
  userId: z.string(),
  displayName: z.string().max(80),
  avatarUrl: z.string().nullish().optional(),
  currentChapterSlug: z.string().max(200),
  paragraphId: z.string().max(100).nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
});
const presenceChangeSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('upsert'), presence: presenceSchema }),
  z.object({ action: z.literal('remove'), userId: z.string() }),
]);
export const presenceChangesSchema = z.array(presenceChangeSchema).max(500);

type JoinAck =
  | {
      ok: true;
      snapshot: {
        presences: PresenceData[];
        room?: RoomResponse;
        members?: { userId: string; role: string }[];
      };
    }
  | {
      ok: false;
      code: string;
      message?: string;
    };

type ReadingRoomServerEvents = {
  connect: void;
  disconnect: unknown;
  connect_error: void;
  [ReadingRoomServerEvent.PRESENCE_UPDATE]: unknown;
  [ReadingRoomServerEvent.MEMBER_JOINED]: { userId: string };
  [ReadingRoomServerEvent.MEMBER_LEFT]: { userId: string };
  [ReadingRoomServerEvent.ROOM_ENDED]: { roomId: string };
  [ReadingRoomServerEvent.ERROR]: { message?: string };
  [ReadingRoomServerEvent.NEW_HIGHLIGHT]: RoomHighlight;
  [ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT]: {
    highlightId: string;
    insight: string;
  };
  [ReadingRoomServerEvent.HIGHLIGHT_REMOVED]: { highlightId: string };
};

export function useReadingRoomSocket(roomCode?: string) {
  const userId = useAppAuth().user?.id;
  const { getSocket, acquireSocket, releaseSocket } = useSocket();
  const socket = useMemo(() => getSocket('/reading-rooms'), [getSocket]);

  const sendHeartbeat = useCallback(
    (
      chapterSlug: string,
      paragraphId?: string,
      progress?: number,
      chapterId?: string,
    ) => {
      if (useReadingRoomStore.getState().connection !== 'joined') return;
      socket.volatile.emit(ReadingRoomClientEvent.HEARTBEAT, {
        roomId: roomCode,
        chapterSlug,
        paragraphId: paragraphId || null,
        progress,
        chapterId,
      });
    },
    [socket, roomCode],
  );

  const addHighlight = useCallback(
    (data: { chapterSlug: string; paragraphId: string; content: string }) => {
      const store = useReadingRoomStore.getState();
      if (socket?.connected && store.room) {
        socket.emit(ReadingRoomClientEvent.ADD_HIGHLIGHT, {
          roomId: store.room.roomId,
          ...data,
        });
      }
    },
    [socket],
  );

  const removeHighlight = useCallback(
    (highlightId: string) => {
      const store = useReadingRoomStore.getState();
      if (socket?.connected && store.room) {
        socket.emit(ReadingRoomClientEvent.REMOVE_HIGHLIGHT, {
          roomId: store.room.roomId,
          highlightId,
        });
      }
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (newHostId?: string) => {
      const store = useReadingRoomStore.getState();
      if (socket && store.room) {
        socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, {
          roomId: store.room.roomId,
          ...(newHostId && { newHostId }),
        });
        useReadingRoomStore.getState().clearRoom();
      }
    },
    [socket],
  );

  const generateHighlightInsight = useCallback(
    (highlightId: string) => {
      const store = useReadingRoomStore.getState();
      if (socket?.connected && store.room) {
        socket.emit(ReadingRoomClientEvent.GENERATE_HIGHLIGHT_INSIGHT, {
          roomId: store.room.roomId,
          highlightId,
        });
      }
    },
    [socket],
  );

  const activeRef = useRef(true);

  // Mapped listeners
  const join = useCallback(() => {
    const store = useReadingRoomStore.getState();
    store.setConnection('joining');
    socket
      .timeout(5000)
      .emit(
        ReadingRoomClientEvent.JOIN_ROOM,
        { roomCode },
        (err: Error | null, ack?: JoinAck) => {
          if (!activeRef.current) return;
          if (err || !ack) {
            return store.setConnection('error', 'TIMEOUT');
          }
          if (!ack.ok) {
            if (ack.message) toast.error(ack.message);
            return store.setConnection('error', ack.code);
          }
          store.hydrate(ack.snapshot);
          if (ack.snapshot.room) store.setRoom(ack.snapshot.room);
          if (ack.snapshot.members) store.setMembers(ack.snapshot.members);
          store.setConnection('joined');
        },
      );
  }, [roomCode, socket]);

  useSocketEvents<ReadingRoomServerEvents>(socket, {
    connect: join,
    disconnect: (reason) => {
      if (reason !== 'io client disconnect')
        useReadingRoomStore.getState().setConnection('reconnecting');
    },
    connect_error: () =>
      useReadingRoomStore.getState().setConnection('reconnecting'),
    [ReadingRoomServerEvent.PRESENCE_UPDATE]: (raw) => {
      const r = presenceChangesSchema.safeParse(raw);
      if (!r.success) {
        console.error('PRESENCE_UPDATE invalid', r.error);
        return;
      }
      const changes: PresenceChange[] = r.data.map((change) =>
        change.action === 'upsert'
          ? { action: 'upsert', presence: change.presence }
          : change,
      );
      useReadingRoomStore.getState().applyPresenceChanges(changes);
    },
    [ReadingRoomServerEvent.MEMBER_JOINED]: (payload) => {
      if (payload.userId === userId) return;
      useReadingRoomStore.getState().addMember(payload.userId);
    },
    [ReadingRoomServerEvent.MEMBER_LEFT]: (payload) =>
      useReadingRoomStore.getState().removeMember(payload.userId),
    [ReadingRoomServerEvent.ROOM_ENDED]: (payload) =>
      useReadingRoomStore.getState().markRoomEnded(payload.roomId),
    [ReadingRoomServerEvent.ERROR]: (payload) => {
      if (
        payload.message?.includes('ended') &&
        useReadingRoomStore.getState().room?.status === 'ended'
      )
        return;
      toast.error(payload.message || 'Lỗi kết nối phòng đọc');
    },
    [ReadingRoomServerEvent.NEW_HIGHLIGHT]: (payload) => {
      useReadingRoomStore.getState().addHighlight(payload);
    },
    [ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT]: (payload) => {
      useReadingRoomStore
        .getState()
        .updateHighlightInsight(payload.highlightId, payload.insight);
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
        socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, { roomId: roomCode });
      }
      useReadingRoomStore.getState().clearRoom();
      releaseSocket('/reading-rooms');
    };
  }, [roomCode, userId, socket, acquireSocket, releaseSocket, join]);

  return {
    socket,
    leaveRoom,
    joinRoom: join,
    sendHeartbeat,
    addHighlight,
    removeHighlight,
    generateHighlightInsight,
  };
}
