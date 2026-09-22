import { keepPreviousData } from '@tanstack/react-query';
import { toxicWordsKeys } from '@/lib/query-keys';
import { getToxicWords } from './toxic-words.api';
import type { GetToxicWordsParams, ToxicWordsResponse } from './toxic-words.api';

export const toxicWordsQueries = {
  list: (params?: GetToxicWordsParams) => ({
    queryKey: toxicWordsKeys.list({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search,
    }),
    queryFn: (): Promise<ToxicWordsResponse> => getToxicWords(params),
    placeholderData: keepPreviousData,
  }),
};