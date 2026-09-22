import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roomInteractionKeys } from '@/lib/query-keys';
import {
  addReaction,
  deleteRoomQuote,
  type AddReactionParams,
} from './room-interactions.api';
import type { RoomReactionEvent } from '../types/room-interaction.types';

export function useAddReaction() {
  return useMutation<RoomReactionEvent, Error, AddReactionParams>({
    mutationFn: addReaction,
  });
}

export function useDeleteRoomQuote() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { code: string; quoteId: string }>({
    mutationFn: deleteRoomQuote,
    onSuccess: (_data, { code }) => {
      queryClient.invalidateQueries({
        queryKey: roomInteractionKeys.quotes(code),
      });
    },
  });
}