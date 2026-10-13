import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { readingRoomsKeys } from '@/lib/query-keys';
import { IdempotencyRequestRunner } from '@/lib/idempotency';
import {
  createRoom,
  reactivateRoom,
  type CreateRoomPayload,
  type RoomResponse,
} from './reading-rooms.api';

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const idempotencyRunner = useRef(new IdempotencyRequestRunner());
  return useMutation<RoomResponse, Error, CreateRoomPayload>({
    mutationFn: (payload) =>
      idempotencyRunner.current.execute(payload, (key) =>
        createRoom(payload, key),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myActive() });
    },
  });
}

export function useReactivateRoom() {
  const queryClient = useQueryClient();
  return useMutation<RoomResponse, Error, string>({
    mutationFn: reactivateRoom,
    onSuccess: (_data, code) => {
      queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myActive() });
      queryClient.invalidateQueries({ queryKey: readingRoomsKeys.myHistory() });
      queryClient.invalidateQueries({ queryKey: readingRoomsKeys.room(code) });
    },
  });
}
