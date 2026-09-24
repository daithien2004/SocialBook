'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AppSessionProvider } from '@/lib/app-session';
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
    <AppSessionProvider>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>{children}</SocketProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </AppSessionProvider>
  );
}