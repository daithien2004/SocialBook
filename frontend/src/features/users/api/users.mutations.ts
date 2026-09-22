import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UpdateUserOverviewRequest,
  UpdateReadingPreferencesRequest,
  User,
} from '@/features/users/schemas/user.schema';
import {
  banUser,
  updateReadingPreferences,
  updateUserAvatar,
  updateUserOverview,
} from './users.api';
import { userKeys } from '@/lib/query-keys';

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, string>({
    mutationFn: (id) => banUser(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.adminLists() });
      queryClient.invalidateQueries({ queryKey: userKeys.overview(id) });
    },
  });
}

export function useUpdateUserOverview() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { userId: string; body: UpdateUserOverviewRequest }>({
    mutationFn: async ({ body }) => updateUserOverview(body),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.overview(userId) });
    },
  });
}

export function useUpdateUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation<{ url: string }, Error, { userId: string; file: File }>({
    mutationFn: async ({ file }) => updateUserAvatar(file),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.overview(userId) });
    },
  });
}

export function useUpdateReadingPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateReadingPreferencesRequest) => updateReadingPreferences(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.readingPreferences(),
      });
    },
  });
}