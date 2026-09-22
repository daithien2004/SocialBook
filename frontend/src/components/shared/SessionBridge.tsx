'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { setAccessToken } from '@/lib/token-store';

export function SessionBridge() {
  const { data } = useSession();

  useEffect(() => {
    setAccessToken(data?.accessToken ?? null);
  }, [data]);

  return null;
}
