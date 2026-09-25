'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { queryClient } from '@/lib/query-client';
import { useAppSession } from '@/lib/app-session';

export function OAuthCallbackHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { refetch } = useAppSession();
  const oauthStatus = searchParams.get('oauth');

  useEffect(() => {
    if (oauthStatus !== 'success') return;

    queryClient.clear();
    void refetch();

    const remaining = new URLSearchParams(searchParams.toString());
    remaining.delete('oauth');
    const query = remaining.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, '', target);
  }, [oauthStatus, pathname, searchParams, refetch]);

  return null;
}
