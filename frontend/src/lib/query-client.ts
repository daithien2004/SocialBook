'use client';

import { QueryClient } from '@tanstack/react-query';
import { GC_TIME, shouldRetry, STALE_TIME } from '@/lib/query-constants';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.DEFAULT,
        gcTime: GC_TIME.DEFAULT,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Export a proxy so existing code using `queryClient.invalidateQueries` still works,
// but it dynamically fetches the correct instance (browser instance on client, new instance on server).
export const queryClient = new Proxy({} as unknown as QueryClient, {
  get(target, prop) {
    return Reflect.get(getQueryClient(), prop);
  }
}) as QueryClient;