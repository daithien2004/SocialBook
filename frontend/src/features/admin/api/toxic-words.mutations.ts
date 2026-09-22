import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toxicWordsKeys } from '@/lib/query-keys';
import {
  addToxicWord,
  deleteToxicWord,
  type AddToxicWordPayload,
  type ToxicWord,
} from './toxic-words.api';

export function useAddToxicWord() {
  const queryClient = useQueryClient();
  return useMutation<ToxicWord, Error, AddToxicWordPayload>({
    mutationFn: addToxicWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toxicWordsKeys.all });
    },
  });
}

export function useDeleteToxicWord() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteToxicWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toxicWordsKeys.all });
    },
  });
}