import { cache } from 'react';

import { env } from '@/env';

const NEST_API_URL = env.NEXT_PUBLIC_NEST_API_URL;

import { cookies } from 'next/headers';
import { unwrapApiResponse } from './api-response';

export const serverApiRequest = cache(async <T>(path: string, init?: RequestInit): Promise<T> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const res = await fetch(`${NEST_API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    throw new Error(`Server fetch failed: ${res.status} ${path}`);
  }
  const body = await res.json();
  return unwrapApiResponse<T>(body);
});