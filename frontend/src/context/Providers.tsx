'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { queryClient } from '@/lib/query-client';
import { SessionBridge } from '@/components/shared/SessionBridge';
import { SocketProvider } from './SocketProvider';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then(
      (m) => m.ReactQueryDevtools,
    ),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <SessionBridge />
      <QueryClientProvider client={queryClient}>
        <SocketProvider>{children}</SocketProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}
