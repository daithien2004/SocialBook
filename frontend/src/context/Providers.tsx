'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { store } from '../store/store';
import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from './SocketProvider';
import { SessionBridge } from '@/components/common/SessionBridge';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={300}>
      <SessionBridge />
      <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <SocketProvider>
              {children}
            </SocketProvider>
          </QueryClientProvider>
      </Provider>
    </SessionProvider>
  );
}
