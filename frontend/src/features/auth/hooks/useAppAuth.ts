import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  Action,
  Subject,
  canAccess,
  defineRulesFor,
} from '@socialbook/shared';

export function useAppAuth() {
  const { data: session, status, update } = useSession();

  const authState = useMemo(() => {
    const user = session?.user;
    const isAuthenticated = status === 'authenticated' && !!user;
    const isGuest = !isAuthenticated;
    const ability = isAuthenticated && user
      ? defineRulesFor(user.role)
      : undefined;
    const isAdmin = !!ability && canAccess(ability, Action.Manage, Subject.All);

    return {
      user,
      isAuthenticated,
      isGuest,
      isAdmin,
      isLoading: status === 'loading',
      accessToken: session?.accessToken,
      update,
    };
  }, [session, status, update]);

  return authState;
}

export type AppAuth = ReturnType<typeof useAppAuth>;
