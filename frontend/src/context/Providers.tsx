'use client';

import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { store } from '../store/store';
import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from './SocketProvider';
import { SessionBridge } from '@/components/common/SessionBridge';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <SessionBridge />
      <Provider store={store}>
        <SocketProvider>
          {children}
        </SocketProvider>
      </Provider>
    </SessionProvider>
  );
}
