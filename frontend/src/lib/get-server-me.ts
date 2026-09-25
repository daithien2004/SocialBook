import { cache } from 'react';
import { headers } from 'next/headers';

export interface ServerMe {
  id: string;
  email: string;
  role: string;
  username: string;
  image?: string;
}

export const getServerMe = cache(async (): Promise<ServerMe | null> => {
  const headersList = await headers();
  const userData = headersList.get('x-user-data');
  if (userData) {
    try {
      return JSON.parse(userData) as ServerMe;
    } catch {
      return null;
    }
  }
  return null;
});