'use client';

import { QueryClient } from '@tanstack/react-query';
import { GC_TIME, shouldRetry, STALE_TIME } from '@/lib/query-constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.DEFAULT,
      gcTime: GC_TIME.DEFAULT,
      retry: shouldRetry,
      refetchOnWindowFocus: true,
    },
  },
});