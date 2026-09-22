import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsKeys } from '@/lib/query-keys';
import { reindexAll, seedReadingHistory } from './analytics.api';

export function useSeedReadingHistory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { days?: number }>({
    mutationFn: seedReadingHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

export function useReindexAll() {
  return useMutation<void, Error, void>({
    mutationFn: reindexAll,
  });
}