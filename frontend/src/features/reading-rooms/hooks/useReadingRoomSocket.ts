import { useCallback, useEffect, useRef } from 'react';
import { useAppAuth } from '@/features/auth/hooks';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { queryClient } from '@/lib/query-client';
import { readingRoomsKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import type { PresenceData, RoomHighlight, ChatMessage } from '@/store/useReadingRoomStore';
import type { RoomResponse } from '@/features/reading-rooms/api/readingRoomsApi';
import type { RoomComment, ReactionType } from '@/features/reading-room-interactions/types/room-interaction.types';
import { ReadingRoomServerEvent, ReadingRoomClientEvent } from '../types/reading-room.events';

interface RoomSnapshotPayload {
  room: RoomResponse;
  members: { userId: string; role: string }[];
  presences: PresenceData[];
}

interface MemberJoinedPayload {
  userId: string;
  displayName: string;
}

interface MemberLeftPayload {
  userId: string;
}

interface HostChangedPayload {
  newHostId: string;
}

interface ChapterChangedPayload {
  chapterSlug: string;
  byUserId: string;
}

interface ModeChangedPayload {
  mode: 'sync' | 'free';
  changedBy: string;
}

interface RoomEndedPayload {
  endedBy: string;
}

interface RoomReactivatedPayload {
  reactivatedBy: string;
}

interface UpdateHighlightInsightPayload {
  highlightId: string;
  insight: string;
}

interface CommentDeletedPayload {
  commentId: string;
  paragraphId: string;
}

interface ReactionAddedPayload {
  paragraphId: string;
  reactionType: ReactionType;
  userId: string;
  displayName?: string;
  chapterSlug?: string;
  paragraphPreview?: string;
}

interface ReactionRemovedPayload {
  paragraphId: string;
  reactionType: ReactionType;
  userId: string;
}

interface QuoteAddedPayload {
  id: string;
  content: string;
  chapterSlug: string;
  paragraphId: string;
  userId: string;
  displayName: string;
  voteCount: number;
  createdAt: string;
}

interface QuoteVotedPayload {
  quoteId: string;
  voteCount: number;
  userId: string;
  voteType: 'up' | 'down' | null;
}

const invalidateRoomCache = (code: string): void => {
  void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myActive() });
  void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myHistory() });
  void queryClient.invalidateQueries({ queryKey: readingRoomsKeys.room(code) });
};

export const useReadingRoomSocket = (roomId?: string) => {
  const { user } = useAppAuth();
  const router = useRouter();
  const { getSocket, connectSocket } = useSocket();
  const socket = getSocket('/reading-rooms');

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const emitJoinRoom = useCallback(() => {
    const currentUser = userRef.current;
    const currentRoomCode = roomIdRef.current;
    if (!currentRoomCode || !currentUser) return;
    if (useReadingRoomStore.getState().room?.status === 'ended') return;
    socket.emit(ReadingRoomClientEvent.JOIN_ROOM, {
      roomCode: currentRoomCode,
      displayName: currentUser.name || currentUser.username || currentUser.email?.split('@')[0] || 'Người dùng',
      avatarUrl: currentUser.image || '',
    });
  }, [socket]);

  const addHighlight = useCallback((data: { chapterSlug: string; paragraphId: string; content: string }) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.ADD_HIGHLIGHT, { 
        roomId: store.room.roomId,
        ...data
      });
    }
  }, [socket]);

  const removeHighlight = useCallback((highlightId: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.REMOVE_HIGHLIGHT, {
        roomId: store.room.roomId,
        highlightId,
      });
    }
  }, [socket]);

  const sendChatMessage = useCallback((content: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.SEND_CHAT_MESSAGE, {
        roomId: store.room.roomId,
        content,
      });
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

  const deleteRoom = useCallback(() => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.DELETE_ROOM, { roomId: store.room.roomId });
    }
  }, [socket]);

  const leaveRoom = useCallback((newHostId?: string) => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, {
        roomId: store.room.roomId,
        ...(newHostId && { newHostId }),
      });
      useReadingRoomStore.getState().clearRoom();
    }
  }, [socket]);

  const sendHeartbeat = useCallback((chapterSlug: string, paragraphId?: string, progress?: number, bookId?: string, chapterId?: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.HEARTBEAT, {
        roomId: store.room.roomId,
        chapterSlug,
        paragraphId,
        progress,
        bookId,
        chapterId,
      });
    }
  }, [socket]);

  const addQuote = useCallback((chapterSlug: string, paragraphId: string, content: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.ADD_QUOTE, {
        roomId: store.room.roomId,
        chapterSlug,
        paragraphId,
        content,
      });
    }
  }, [socket]);

  const voteQuote = useCallback((quoteId: string, voteType: 'up' | 'down') => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.VOTE_QUOTE, {
        roomId: store.room.roomId,
        quoteId,
        voteType,
      });
    }
  }, [socket]);

  const generateHighlightInsight = useCallback((highlightId: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.GENERATE_HIGHLIGHT_INSIGHT, { roomId: store.room.roomId, highlightId });
    }
  }, [socket]);

  useSocketEvents(socket, {
    connect: () => {
      emitJoinRoom();
    },
    [ReadingRoomServerEvent.ROOM_SNAPSHOT]: (payload: unknown) => {
      const data = payload as RoomSnapshotPayload;
      const store = useReadingRoomStore.getState();
      store.setRoom(data.room);
      store.setMembers(data.members);
      store.updatePresences(data.presences);
    },
    [ReadingRoomServerEvent.MEMBER_JOINED]: (payload: unknown) => {
      const data = payload as MemberJoinedPayload;
      if (data.userId === userRef.current?.id) return;
      useReadingRoomStore.getState().addMember(data.userId);
      toast.success(`${data.displayName} đã tham gia phòng`);
    },
    [ReadingRoomServerEvent.MEMBER_LEFT]: (payload: unknown) => {
      const data = payload as MemberLeftPayload;
      useReadingRoomStore.getState().removeMember(data.userId);
    },
    [ReadingRoomServerEvent.PRESENCE_UPDATE]: (payload: unknown) => {
      const presences = payload as PresenceData[];
      useReadingRoomStore.getState().updatePresences(presences);
    },
    [ReadingRoomServerEvent.HOST_CHANGED]: (payload: unknown) => {
      const data = payload as HostChangedPayload;
      const store = useReadingRoomStore.getState();
      if (store.room) {
        store.setRoom({ ...store.room, hostId: data.newHostId });
      }
      if (data.newHostId === userRef.current?.id) {
        toast.success('Bạn đã trở thành trưởng phòng mới!');
      }
    },
    [ReadingRoomServerEvent.CHAPTER_CHANGED]: (payload: unknown) => {
      const data = payload as ChapterChangedPayload;
      useReadingRoomStore.getState().updateChapter(data.chapterSlug);
      if (data.byUserId !== userRef.current?.id) {
        toast.info('Trưởng phòng đã chuyển chương');
      }
    },
    [ReadingRoomServerEvent.MODE_CHANGED]: (payload: unknown) => {
      const data = payload as ModeChangedPayload;
      const store = useReadingRoomStore.getState();
      if (store.room) {
        store.setRoom({ ...store.room, mode: data.mode });
        if (data.changedBy !== userRef.current?.id) {
          toast.info(`Chế độ phòng đã đổi thành: ${data.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}`);
        }
      }
    },
    [ReadingRoomServerEvent.ROOM_ENDED]: (payload: unknown) => {
      const data = payload as RoomEndedPayload;
      if (data.endedBy !== userRef.current?.id) {
        toast.info('Phòng đọc đã kết thúc');
      }
      useReadingRoomStore.getState().clearRoom();
      const currentRoomCode = roomIdRef.current;
      if (currentRoomCode) invalidateRoomCache(currentRoomCode);
      router.refresh();
    },
    [ReadingRoomServerEvent.ROOM_REACTIVATED]: (payload: unknown) => {
      const data = payload as RoomReactivatedPayload;
      if (data.reactivatedBy !== userRef.current?.id) {
        toast.info('Phòng đọc đã được mở lại');
      }
      const store = useReadingRoomStore.getState();
      if (store.room) {
        store.setRoom({ ...store.room, status: 'active' });
      }
      const currentRoomCode = roomIdRef.current;
      if (currentRoomCode) invalidateRoomCache(currentRoomCode);
      router.refresh();
    },
    [ReadingRoomServerEvent.ROOM_DELETED]: () => {
      toast.error('Phòng đọc đã bị xoá');
      useReadingRoomStore.getState().clearRoom();
      const currentRoomCode = roomIdRef.current;
      if (currentRoomCode) invalidateRoomCache(currentRoomCode);
      router.refresh();
    },
    [ReadingRoomServerEvent.ERROR]: (payload: unknown) => {
      const error = payload as { message?: string };
      if (error.message?.includes('ended') && useReadingRoomStore.getState().room?.status === 'ended') return;
      toast.error(error.message || 'Lỗi kết nối phòng đọc');
    },
    [ReadingRoomServerEvent.NEW_HIGHLIGHT]: (payload: unknown) => {
      const data = payload as RoomHighlight;
      useReadingRoomStore.getState().addHighlight(data);
    },
    [ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT]: (payload: unknown) => {
      const data = payload as UpdateHighlightInsightPayload;
      useReadingRoomStore.getState().updateHighlightInsight(data.highlightId, data.insight);
    },
    [ReadingRoomServerEvent.HIGHLIGHT_REMOVED]: (payload: unknown) => {
      const data = payload as { highlightId: string };
      useReadingRoomStore.getState().removeHighlight(data.highlightId);
    },
    [ReadingRoomServerEvent.NEW_CHAT_MESSAGE]: (payload: unknown) => {
      const message = payload as ChatMessage;
      useReadingRoomStore.getState().addChatMessage(message);
    },
    [ReadingRoomServerEvent.COMMENT_ADDED]: (payload: unknown) => {
      const data = payload as RoomComment;
      const displayName = data.displayName || data.userId.slice(0, 6);
      useReadingRoomStore.getState().addRoomComment({ ...data, displayName });
    },
    [ReadingRoomServerEvent.COMMENT_DELETED]: (payload: unknown) => {
      const data = payload as CommentDeletedPayload;
      useReadingRoomStore.getState().removeRoomComment(data.commentId, data.paragraphId);
    },
    [ReadingRoomServerEvent.REACTION_ADDED]: (payload: unknown) => {
      const data = payload as ReactionAddedPayload;
      const store = useReadingRoomStore;
      store.getState().updateReaction(data.paragraphId, data.reactionType, data.userId, true);
      store.getState().addEmotionEvent({
        userId: data.userId,
        displayName: data.displayName || data.userId.slice(0, 6),
        avatarUrl: '',
        reactionType: data.reactionType,
        chapterSlug: data.chapterSlug || '',
        paragraphId: data.paragraphId,
        paragraphPreview: data.paragraphPreview,
        timestamp: Date.now(),
      });
    },
    [ReadingRoomServerEvent.REACTION_REMOVED]: (payload: unknown) => {
      const data = payload as ReactionRemovedPayload;
      useReadingRoomStore.getState().updateReaction(data.paragraphId, data.reactionType, data.userId, false);
    },
    [ReadingRoomServerEvent.QUOTE_ADDED]: (payload: unknown) => {
      const data = payload as QuoteAddedPayload;
      useReadingRoomStore.getState().addQuote({
        id: data.id,
        content: data.content,
        chapterSlug: data.chapterSlug,
        paragraphId: data.paragraphId,
        userId: data.userId,
        displayName: data.displayName,
        votes: [],
        voteCount: data.voteCount,
        createdAt: data.createdAt,
      });
    },
    [ReadingRoomServerEvent.QUOTE_VOTED]: (payload: unknown) => {
      const data = payload as QuoteVotedPayload;
      useReadingRoomStore.getState().updateQuoteVote(
        data.quoteId,
        data.voteCount,
        data.userId,
        data.voteType,
      );
    },
  });

  useEffect(() => {
    if (!roomId || !socket || !user) return;

    connectSocket('/reading-rooms');

    if (socket.connected) {
      emitJoinRoom();
    }
  }, [roomId, socket, user, connectSocket, emitJoinRoom]);

  useEffect(() => {
    return () => {
      if (socket.connected) {
        const store = useReadingRoomStore.getState();
        const currentRoomId = store.room?.roomId || roomIdRef.current;
        if (currentRoomId) {
          socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, { roomId: currentRoomId });
        }
        socket.disconnect();
      }
      useReadingRoomStore.getState().clearRoom();
    };
  }, [socket]);

  const changeMode = useCallback((newMode: 'sync' | 'free') => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.CHANGE_MODE, {
        roomId: store.room.roomId,
        mode: newMode,
      });
    }
  }, [socket]);

  return {
    socket,
    changeChapter,
    changeMode,
    endRoom,
    deleteRoom,
    leaveRoom,
    sendHeartbeat,
    addHighlight,
    removeHighlight,
    generateHighlightInsight,
    sendChatMessage,
    addQuote,
    voteQuote,
  };
};