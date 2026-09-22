import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userHighlightKeys } from '@/lib/query-keys';
import {
  createHighlight,
  deleteHighlight,
  updateHighlight,
} from './user-highlights.api';
import type {
  CreateUserHighlightPayload,
  UpdateUserHighlightPayload,
  UserHighlight,
} from '../types/user-highlight.interface';

export function useCreateHighlight() {
  const queryClient = useQueryClient();
  return useMutation<UserHighlight, Error, CreateUserHighlightPayload>({
    mutationFn: createHighlight,
    onSuccess: (_data, { bookId, chapterId }) => {
      queryClient.invalidateQueries({ queryKey: userHighlightKeys.byBook(bookId) });
      queryClient.invalidateQueries({ queryKey: userHighlightKeys.byChapter(chapterId) });
    },
  });
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient();
  return useMutation<UserHighlight, Error, UpdateUserHighlightPayload>({
    mutationFn: updateHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userHighlightKeys.all });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userHighlightKeys.all });
    },
  });
}