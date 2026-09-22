import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';
import { shouldRetry, STALE_TIME } from '@/lib/query-constants';

export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: STALE_TIME.DEFAULT,
          retry: shouldRetry,
        },
      },
    }),
);