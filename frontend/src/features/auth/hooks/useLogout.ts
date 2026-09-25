import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/lib/query-client';
import { useAppSession } from '@/lib/app-session';
import { getCsrfToken } from '@/lib/utils';

export interface UseLogoutResult {
  handleLogout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
  const router = useRouter();
  const { refetch } = useAppSession();

  const handleLogout = useCallback(async () => {
    queryClient.clear();
    try {
      const csrfToken = getCsrfToken();
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
      });
    } catch {
    } finally {
      await refetch();
      router.push('/login');
    }
  }, [router, refetch]);

  return { handleLogout };
}
