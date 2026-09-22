import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { queryClient } from '@/lib/query-client';

export interface UseLogoutResult {
  handleLogout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    queryClient.clear();
    await signOut({ redirect: false });
    router.push('/login');
  }, [router]);

  return { handleLogout };
}
