import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/lib/query-client';
import { useAppSession } from '@/lib/app-session';
import { apiRequest } from '@/lib/api-client';

export interface UseLogoutResult {
  handleLogout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
  const router = useRouter();
  const { refetch } = useAppSession();

  const handleLogout = useCallback(async () => {
    queryClient.clear();
    try {
      await apiRequest({
        url: '/auth/logout',
        method: 'POST',
        skipAuthRedirect: true,
      });
    } catch {
    } finally {
      await refetch();
      router.push('/login');
    }
  }, [router, refetch]);

  return { handleLogout };
}
