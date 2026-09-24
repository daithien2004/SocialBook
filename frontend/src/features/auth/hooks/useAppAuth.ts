import { useMemo } from 'react';
import { Action, Subject, canAccess, defineRulesFor } from '@socialbook/shared';
import { useAppSession } from '@/lib/app-session';

export function useAppAuth() {
  const { user, isLoading, refetch } = useAppSession();

  const authState = useMemo(() => {
    const isAuthenticated = !!user && !isLoading;
    const ability =
      isAuthenticated && user ? defineRulesFor(user.role, user.id) : undefined;
    const isAdmin = !!ability && canAccess(ability, Action.Manage, Subject.All);

    return {
      user,
      isAuthenticated,
      isGuest: !isAuthenticated,
      isAdmin,
      ability,
      isLoading,
      refetch,
    };
  }, [user, isLoading, refetch]);

  return authState;
}

export type AppAuth = ReturnType<typeof useAppAuth>;