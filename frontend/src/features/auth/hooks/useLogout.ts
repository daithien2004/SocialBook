import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppSession } from '@/lib/app-session';
import { apiRequest } from '@/lib/api-client';

export interface UseLogoutResult {
  handleLogout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  }, [queryClient, router, refetch]);

  return { handleLogout };
}
