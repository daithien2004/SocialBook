import { useEffect, useCallback, useRef } from 'react';
import { useAppAuth } from '@/features/auth/hooks';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { ReadingRoomServerEvent, ReadingRoomClientEvent } from '../types/reading-room.events';

export const useReadingRoomSocket = (roomId?: string) => {
  const { user } = useAppAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getSocket, connectSocket } = useSocket();
  const socket = getSocket('/reading-rooms');
  const listenersSetupRef = useRef(false);

  const setupListeners = useCallback(() => {
    if (!socket || !user || listenersSetupRef.current) return;
    listenersSetupRef.current = true;

    // Cleanup old listeners first
    socket.off('connect');
    socket.off(ReadingRoomServerEvent.ROOM_SNAPSHOT);
    socket.off(ReadingRoomServerEvent.MEMBER_JOINED);
    socket.off(ReadingRoomServerEvent.MEMBER_LEFT);
    socket.off(ReadingRoomServerEvent.PRESENCE_UPDATE);
    socket.off(ReadingRoomServerEvent.CHAPTER_CHANGED);
    socket.off(ReadingRoomServerEvent.ROOM_ENDED);
    socket.off(ReadingRoomServerEvent.ANNOTATION_ADDED);
    socket.off(ReadingRoomServerEvent.ANNOTATION_REMOVED);
    socket.off(ReadingRoomServerEvent.ERROR);

    socket.on('connect', () => {
      if (roomId) {
        socket.emit(ReadingRoomClientEvent.JOIN_ROOM, {
          roomCode: roomId,
          displayName: user.name || user.username || user.email?.split('@')[0] || 'Người dùng',
          avatarUrl: user.image || '',
        });
      }
    });

    socket.on(ReadingRoomServerEvent.ROOM_SNAPSHOT, (data) => {
      const store = useReadingRoomStore.getState();
      store.setRoom(data.room);
      store.setMembers(data.members);
      store.updatePresences(data.presences);
    });

    socket.on(ReadingRoomServerEvent.MEMBER_JOINED, (data) => {
      // Don't show toast if it's the current user joining
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
        toast.info(`Chế độ phòng đã đổi thành: ${data.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}`);
      }
    });

    socket.on(ReadingRoomServerEvent.ROOM_ENDED, () => {
      toast.info('Phòng đọc đã kết thúc');
      useReadingRoomStore.getState().clearRoom();
      // Invalidate the myActiveRooms query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['myActiveRooms'] });
      router.push('/reading-rooms');
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
      toast.error(error.message || 'Lỗi kết nối phòng đọc');
    });

    socket.on('new_highlight', (data) => {
      useReadingRoomStore.getState().addHighlight(data);
    });

    socket.on('update_highlight_insight', (data) => {
      useReadingRoomStore.getState().updateHighlightInsight(data.highlightId, data.insight);
    });

    socket.on('new_chat_message', (message) => {
      useReadingRoomStore.getState().addChatMessage(message);
    });

    // Cleanup listeners
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
      socket.off(ReadingRoomServerEvent.ANNOTATION_ADDED);
      socket.off(ReadingRoomServerEvent.ANNOTATION_REMOVED);
      socket.off(ReadingRoomServerEvent.NEW_HIGHLIGHT);
      socket.off(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT);
      socket.off(ReadingRoomServerEvent.NEW_CHAT_MESSAGE);
      socket.off(ReadingRoomServerEvent.ERROR);
    };
  }, [user, router, socket, roomId]);


  const addHighlight = useCallback((data: { chapterSlug: string; paragraphId: string; content: string }) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.ADD_HIGHLIGHT, { 
        roomId: store.room.roomId,
        ...data
      });
    }
  }, [socket]);

  const askAI = useCallback((question: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.ASK_AI, {
        roomId: store.room.roomId,
        question,
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

  const leaveRoom = useCallback(() => {
    const store = useReadingRoomStore.getState();
    if (socket && store.room) {
      socket.emit(ReadingRoomClientEvent.LEAVE_ROOM, { roomId: store.room.roomId });
    }
  }, [socket]);

  const sendHeartbeat = useCallback((chapterSlug: string, paragraphId?: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit(ReadingRoomClientEvent.HEARTBEAT, {
        roomId: store.room.roomId,
        chapterSlug,
        paragraphId,
      });
    }
  }, [socket]);

  const notifyCommented = useCallback((paragraphId: string, chapterId: string, commentId: string) => {
    const store = useReadingRoomStore.getState();
    if (socket?.connected && store.room) {
      socket.emit('paragraph_commented', { 
        roomId: store.room.roomId,
        paragraphId,
        chapterId,
        commentId,
      });
    }
  }, [socket]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const init = async () => {
      if (roomId) {
        const s = await connectSocket('/reading-rooms');
        if (s) {
          cleanup = setupListeners();
          
          // Only emit join_room if not already in this room to prevent redundant join events on remount
          const currentStoreRoomId = useReadingRoomStore.getState().room?.roomId;
          if (s.connected && user && currentStoreRoomId !== roomId) {
            s.emit('join_room', {
              roomCode: roomId,
              displayName: user.name || user.username || user.email?.split('@')[0] || 'Người dùng',
              avatarUrl: user.image || '',
            });
          }
        }
      }
    };

    init();

    return () => {
      if (cleanup) cleanup();
    };

   }, [roomId, connectSocket, user]);

  useEffect(() => {
    listenersSetupRef.current = false;
  }, [roomId]);

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
    leaveRoom,
    sendHeartbeat,
    notifyCommented,
    addHighlight,
    askAI,
    sendChatMessage,
  };
};


