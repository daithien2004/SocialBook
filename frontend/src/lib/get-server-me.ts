import { cache } from 'react';
import { cookies } from 'next/headers';
import serverApi from '@/lib/server-api';

export interface ServerMe {
  id: string;
  email: string;
  role: string;
  username: string;
  image?: string;
}

export const getServerMe = cache(async (): Promise<ServerMe | null> => {
  const cookieHeader = (await cookies()).toString();
  const response = await serverApi.get('/auth/me', {
    headers: { cookie: cookieHeader },
    validateStatus: (status) => status < 500,
  });
  if (response.status !== 200) return null;
  const data = response.data?.data as ServerMe | undefined;
  return data ?? null;
});