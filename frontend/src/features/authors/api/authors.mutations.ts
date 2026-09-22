import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorKeys } from '@/lib/query-keys';
import type {
  CreateAuthorRequest,
  UpdateAuthorRequest,
} from '../schemas/author.schema';
import { createAuthor, deleteAuthor, updateAuthor } from './authors.api';

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAuthorRequest | FormData) => createAuthor(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authorKeys.all });
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateAuthorRequest) => updateAuthor(request),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: authorKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: authorKeys.all });
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAuthor(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authorKeys.all });
    },
  });
}