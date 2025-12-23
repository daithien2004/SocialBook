import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useAppAuth() {
  const { data: session, status, update } = useSession();

  const authState = useMemo(() => {
    const user = session?.user;
    const isAuthenticated = status === 'authenticated' && !!user;
    const isGuest = !isAuthenticated;
    const isAdmin = isAuthenticated && user?.role === 'admin';

    return {
      user,
      isAuthenticated,
      isGuest,
      isAdmin,
      isLoading: status === 'loading',
      // Helper specific to your app
      isOnboardingCompleted: user?.onboardingCompleted ?? false,
      accessToken: session?.accessToken,
      update,
    };
  }, [session, status, update]);

  return authState;
}

export type AppAuth = ReturnType<typeof useAppAuth>;
