import { useEffect, useCallback } from 'react';
import { useAppAuth } from '@/features/auth/hooks';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { store as reduxStore } from '@/store/store';
import { readingRoomsApi } from '@/features/reading-rooms/api/readingRoomsApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomServerEvent, ReadingRoomClientEvent } from '../types/reading-room.events';

export const useReadingRoomSocket = (roomId?: string) => {
  const { user } = useAppAuth();
  const router = useRouter();
  const { getSocket, connectSocket } = useSocket();
  const socket = getSocket('/reading-rooms');


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

  const changeChapter = useCallback((chapterSlug: string) => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.CHAPTER_CHANGE, { roomId: store.room.roomId, chapterSlug });
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

  const leaveRoom = useCallback(() => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, { roomId: store.room.roomId });
      useReadingRoomStore.getState().clearRoom();
    }
  }, [socket]);

  const sendHeartbeat = useCallback((chapterSlug: string, paragraphId?: string, progress?: number) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.HEARTBEAT, {
        roomId: store.room.roomId,
        chapterSlug,
        paragraphId,
        progress,
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

  const notifyCommented = useCallback((paragraphId: string, chapterId: string, commentId: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.PARAGRAPH_COMMENTED, { 
        roomId: store.room.roomId,
        paragraphId,
        chapterId,
        commentId,
      });
    }
  }, [socket]);

  useEffect(() => {
    if (!roomId || !socket || !user) return;

    connectSocket('/reading-rooms');

    socket.off('connect');
    socket.off(ReadingRoomServerEvent.ROOM_SNAPSHOT);
    socket.off(ReadingRoomServerEvent.MEMBER_JOINED);
    socket.off(ReadingRoomServerEvent.MEMBER_LEFT);
    socket.off(ReadingRoomServerEvent.PRESENCE_UPDATE);
    socket.off(ReadingRoomServerEvent.HOST_CHANGED);
    socket.off(ReadingRoomServerEvent.CHAPTER_CHANGED);
    socket.off(ReadingRoomServerEvent.MODE_CHANGED);
    socket.off(ReadingRoomServerEvent.ROOM_ENDED);
    socket.off(ReadingRoomServerEvent.ROOM_DELETED);
    socket.off(ReadingRoomServerEvent.ANNOTATION_ADDED);
    socket.off(ReadingRoomServerEvent.ANNOTATION_REMOVED);
    socket.off(ReadingRoomServerEvent.NEW_HIGHLIGHT);
    socket.off(ReadingRoomServerEvent.HIGHLIGHT_REMOVED);
    socket.off(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT);
    socket.off(ReadingRoomServerEvent.NEW_CHAT_MESSAGE);
    socket.off(ReadingRoomServerEvent.ERROR);
    socket.off(ReadingRoomServerEvent.COMMENT_ADDED);
    socket.off(ReadingRoomServerEvent.COMMENT_DELETED);
    socket.off(ReadingRoomServerEvent.REACTION_ADDED);
    socket.off(ReadingRoomServerEvent.QUOTE_ADDED);
    socket.off(ReadingRoomServerEvent.QUOTE_VOTED);

    socket.on('connect', () => {
      if (useReadingRoomStore.getState().room?.status === 'ended') return;
      socket.emit(ReadingRoomClientEvent.JOIN_ROOM, {
        roomCode: roomId,
        displayName: user.name || user.username || user.email?.split('@')[0] || 'Người dùng',
        avatarUrl: user.image || '',
      });
    });

    socket.on(ReadingRoomServerEvent.ROOM_SNAPSHOT, (data) => {
      const store = useReadingRoomStore.getState();
      store.setRoom(data.room);
      store.setMembers(data.members);
      store.updatePresences(data.presences);
    });

    socket.on(ReadingRoomServerEvent.MEMBER_JOINED, (data) => {
      if (data.userId === user.id) return;
      useReadingRoomStore.getState().addMember(data.userId);
      toast.success(`${data.displayName} đã tham gia phòng`);
    });

    socket.on(ReadingRoomServerEvent.MEMBER_LEFT, (data) => {
      useReadingRoomStore.getState().removeMember(data.userId);
    });

    socket.on(ReadingRoomServerEvent.PRESENCE_UPDATE, (presences) => {
      useReadingRoomStore.getState().updatePresences(presences);
    });

    socket.on(ReadingRoomServerEvent.HOST_CHANGED, (data) => {
      const store = useReadingRoomStore.getState();
      if (store.room) {
        store.setRoom({ ...store.room, hostId: data.newHostId });
      }
      if (data.newHostId === user.id) {
        toast.success('Bạn đã trở thành trưởng phòng mới!');
      }
    });

    socket.on(ReadingRoomServerEvent.CHAPTER_CHANGED, (data) => {
      useReadingRoomStore.getState().updateChapter(data.chapterSlug);
      if (data.byUserId !== user.id) {
        toast.info('Trưởng phòng đã chuyển chương');
      }
    });

    socket.on(ReadingRoomServerEvent.MODE_CHANGED, (data) => {
      const store = useReadingRoomStore.getState();
      if (store.room) {
        store.setRoom({ ...store.room, mode: data.mode });
        if (data.changedBy !== user.id) {
          toast.info(`Chế độ phòng đã đổi thành: ${data.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}`);
        }
      }
    });

    socket.on(ReadingRoomServerEvent.ROOM_ENDED, (data) => {
      if (data.endedBy !== user.id) {
        toast.info('Phòng đọc đã kết thúc');
      }
      useReadingRoomStore.getState().clearRoom();
      reduxStore.dispatch(readingRoomsApi.util.invalidateTags(['MyRooms', 'MyHistory', { type: 'Room', id: roomId }]));
      router.refresh();
    });

    socket.on(ReadingRoomServerEvent.ROOM_DELETED, () => {
      toast.error('Phòng đọc đã bị xoá');
      useReadingRoomStore.getState().clearRoom();
      reduxStore.dispatch(readingRoomsApi.util.invalidateTags(['MyRooms', 'MyHistory', { type: 'Room', id: roomId }]));
      router.refresh();
    });

    socket.on(ReadingRoomServerEvent.ANNOTATION_ADDED, (data) => {
      const store = useReadingRoomStore.getState();
      const currentCount = store.annotations[data.paragraphId] || 0;
      store.updateAnnotation(data.paragraphId, currentCount + 1);
    });

    socket.on(ReadingRoomServerEvent.ANNOTATION_REMOVED, (data) => {
      const store = useReadingRoomStore.getState();
      const currentCount = store.annotations[data.paragraphId] || 0;
      if (currentCount > 1) {
        store.updateAnnotation(data.paragraphId, currentCount - 1);
      } else {
        store.removeAnnotation(data.paragraphId);
      }
    });

    socket.on(ReadingRoomServerEvent.ERROR, (error) => {
      if (error.message?.includes('ended') && useReadingRoomStore.getState().room?.status === 'ended') return;
      toast.error(error.message || 'Lỗi kết nối phòng đọc');
    });

    socket.on(ReadingRoomServerEvent.NEW_HIGHLIGHT, (data) => {
      useReadingRoomStore.getState().addHighlight(data);
    });

    socket.on(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT, (data) => {
      useReadingRoomStore.getState().updateHighlightInsight(data.highlightId, data.insight);
    });

    socket.on(ReadingRoomServerEvent.HIGHLIGHT_REMOVED, (data) => {
      useReadingRoomStore.getState().removeHighlight(data.highlightId);
    });

    socket.on(ReadingRoomServerEvent.NEW_CHAT_MESSAGE, (message) => {
      useReadingRoomStore.getState().addChatMessage(message);
    });

    socket.on(ReadingRoomServerEvent.COMMENT_ADDED, (data) => {
      const store = useReadingRoomStore;
      const displayName = data.displayName || data.userId.slice(0, 6);
      store.getState().addRoomComment({ ...data, displayName });
    });

    socket.on(ReadingRoomServerEvent.COMMENT_DELETED, (data) => {
      useReadingRoomStore.getState().removeRoomComment(data.commentId, data.paragraphId);
    });

    socket.on(ReadingRoomServerEvent.REACTION_ADDED, (data) => {
      const store = useReadingRoomStore;
      store.getState().updateReaction(data.paragraphId, data.reactionType, data.userId, true);
    });

    socket.on(ReadingRoomServerEvent.QUOTE_ADDED, (data) => {
      const store = useReadingRoomStore.getState();
      store.addQuote({
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
    });

    socket.on(ReadingRoomServerEvent.QUOTE_VOTED, (data) => {
      useReadingRoomStore.getState().updateQuoteVote(
        data.quoteId,
        data.voteCount,
        data.userId,
        data.voteType,
      );
    });

    if (socket.connected) {
      if (useReadingRoomStore.getState().room?.status === 'ended') return;
      socket.emit(ReadingRoomClientEvent.JOIN_ROOM, {
        roomCode: roomId,
        displayName: user.name || user.username || user.email?.split('@')[0] || 'Người dùng',
        avatarUrl: user.image || '',
      });
    }

    return () => {
      socket.off('connect');
      socket.off(ReadingRoomServerEvent.ROOM_SNAPSHOT);
      socket.off(ReadingRoomServerEvent.MEMBER_JOINED);
      socket.off(ReadingRoomServerEvent.MEMBER_LEFT);
      socket.off(ReadingRoomServerEvent.PRESENCE_UPDATE);
      socket.off(ReadingRoomServerEvent.HOST_CHANGED);
      socket.off(ReadingRoomServerEvent.CHAPTER_CHANGED);
      socket.off(ReadingRoomServerEvent.MODE_CHANGED);
      socket.off(ReadingRoomServerEvent.ROOM_ENDED);
      socket.off(ReadingRoomServerEvent.ROOM_DELETED);
      socket.off(ReadingRoomServerEvent.ANNOTATION_ADDED);
      socket.off(ReadingRoomServerEvent.ANNOTATION_REMOVED);
      socket.off(ReadingRoomServerEvent.NEW_HIGHLIGHT);
      socket.off(ReadingRoomServerEvent.HIGHLIGHT_REMOVED);
      socket.off(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT);
      socket.off(ReadingRoomServerEvent.NEW_CHAT_MESSAGE);
      socket.off(ReadingRoomServerEvent.ERROR);
      socket.off(ReadingRoomServerEvent.COMMENT_ADDED);
      socket.off(ReadingRoomServerEvent.COMMENT_DELETED);
      socket.off(ReadingRoomServerEvent.REACTION_ADDED);
      socket.off(ReadingRoomServerEvent.QUOTE_ADDED);
      socket.off(ReadingRoomServerEvent.QUOTE_VOTED);
    };
  }, [roomId, socket, user, connectSocket, router]);

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
    notifyCommented,
    addHighlight,
    removeHighlight,
    sendChatMessage,
    addQuote,
    voteQuote,
  };
};
