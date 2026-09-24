import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/lib/query-client';
import { useAppSession } from '@/lib/app-session';

export interface UseLogoutResult {
  handleLogout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
  const router = useRouter();
  const { refetch } = useAppSession();

  const handleLogout = useCallback(async () => {
    queryClient.clear();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // đăng xuất local vẫn diễn ra khi backend không phản hồi
    } finally {
      await refetch();
      router.push('/login');
    }
  }, [router, refetch]);

  return { handleLogout };
}