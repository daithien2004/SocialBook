import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readingRoomsKeys } from '@/lib/query-keys';
import {
  createRoom,
  reactivateRoom,
  type CreateRoomPayload,
  type RoomResponse,
} from './reading-rooms.api';

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation<RoomResponse, Error, CreateRoomPayload>({
    mutationFn: createRoom,
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