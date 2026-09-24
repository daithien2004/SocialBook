'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

export interface AppUser {
  id: string;
  email: string;
  role: string;
  username: string;
  image?: string;
}

interface AppSessionValue {
  user: AppUser | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const AppSessionContext = createContext<AppSessionValue>({
  user: null,
  isLoading: true,
  refetch: async () => undefined,
});

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const json = (await res.json()) as { data?: AppUser };
        setUser(json.data ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({ user, isLoading, refetch }),
    [user, isLoading, refetch],
  );
  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession(): AppSessionValue {
  return useContext(AppSessionContext);
}