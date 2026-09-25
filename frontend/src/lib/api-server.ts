import { cache } from 'react';
import { redirect } from 'next/navigation';

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(`${NEST_API_URL}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        Cookie: cookieHeader,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/login?error=SessionExpired');
    }
    throw new Error(`Server fetch failed: ${res.status} ${path}`);
  }
  const body = await res.json();
  return unwrapApiResponse<T>(body);
});