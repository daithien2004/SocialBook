import { useMutation, useQueryClient } from '@tanstack/react-query';
import { genreKeys } from '@/lib/query-keys';
import type {
  CreateGenreRequest,
  UpdateGenreRequest,
} from '../schemas/genre.schema';
import { createGenre, deleteGenre, updateGenre } from './genres.api';

export function useCreateGenre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGenreRequest) => createGenre(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: genreKeys.all });
    },
  });
}

export function useUpdateGenre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateGenreRequest) => updateGenre(request),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: genreKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: genreKeys.all });
    },
  });
}

export function useDeleteGenre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGenre(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: genreKeys.all });
    },
  });
}