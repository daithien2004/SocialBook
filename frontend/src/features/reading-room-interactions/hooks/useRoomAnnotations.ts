'use client';
import { useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomClientEvent, ReadingRoomServerEvent } from '@/features/reading-rooms/types/reading-room.events';
import type { RoomComment, RoomSocket } from '../types/room-interaction.types';

export const useRoomAnnotations = () => {
  const { getSocket } = useSocket();
  const socket = getSocket('/reading-rooms');

  const addComment = useCallback((
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    content: string,
    parentCommentId?: string,
  ) => {
    if (!socket?.connected) return;
    socket.emit(ReadingRoomClientEvent.ADD_COMMENT, {
      roomId,
      chapterSlug,
      paragraphId,
      content,
      parentCommentId,
    });
  }, [socket]);

  const deleteComment = useCallback((
    roomId: string,
    commentId: string,
    paragraphId: string,
  ) => {
    if (!socket?.connected) return;
    socket.emit(ReadingRoomClientEvent.DELETE_COMMENT, {
      roomId,
      commentId,
      paragraphId,
    });
  }, [socket]);

  return { addComment, deleteComment };
};

interface RoomAnnotationStore {
  getState(): {
    addRoomComment: (data: RoomComment) => void;
    removeRoomComment: (commentId: string, paragraphId: string) => void;
  };
}

export const setupRoomAnnotationListeners = (socket: RoomSocket | null | undefined, store: RoomAnnotationStore | null | undefined) => {
  if (!socket || !store) return;

  socket.on(ReadingRoomServerEvent.COMMENT_ADDED, (data: unknown) => {
    store.getState().addRoomComment(data as RoomComment);
  });

  socket.on(ReadingRoomServerEvent.COMMENT_DELETED, (data: unknown) => {
    const { commentId, paragraphId } = data as { commentId: string; paragraphId: string };
    store.getState().removeRoomComment(commentId, paragraphId);
  });
};
