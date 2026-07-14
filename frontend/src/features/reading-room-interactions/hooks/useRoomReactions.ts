'use client';
import { useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomClientEvent, ReadingRoomServerEvent } from '@/features/reading-rooms/types/reading-room.events';
import type { ReactionType, RoomReactionEvent, RoomSocket } from '../types/room-interaction.types';

export const useRoomReactions = () => {
  const { getSocket } = useSocket();
  const socket = getSocket('/reading-rooms');

  const addReaction = useCallback((
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    reactionType: ReactionType,
  ) => {
    if (!socket?.connected) return;
    socket.emit(ReadingRoomClientEvent.ADD_REACTION, {
      roomId,
      chapterSlug,
      paragraphId,
      reactionType,
    });
  }, [socket]);

  return { addReaction };
};

interface RoomReactionStore {
  getState(): {
    updateReaction: (paragraphId: string, reactionType: string, userId: string, add: boolean) => void;
  };
}

export const setupRoomReactionListeners = (socket: RoomSocket | null | undefined, store: RoomReactionStore | null | undefined) => {
  if (!socket || !store) return;

  socket.on(ReadingRoomServerEvent.REACTION_ADDED, (data: unknown) => {
    const event = data as RoomReactionEvent;
    store.getState().updateReaction(
      event.paragraphId,
      event.reactionType,
      event.userId,
      true,
    );
  });

  socket.on(ReadingRoomServerEvent.REACTION_REMOVED, (data: unknown) => {
    const event = data as RoomReactionEvent;
    store.getState().updateReaction(
      event.paragraphId,
      event.reactionType,
      event.userId,
      false,
    );
  });
};
