import { cache } from 'react';

import { env } from '@/env';

const NEST_API_URL = env.NEXT_PUBLIC_NEST_API_URL;

interface RawApiResponse<T> {
  message?: string;
  data?: T;
  meta?: unknown;
  warning?: string;
}

import { cookies } from 'next/headers';

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
  const body = (await res.json()) as RawApiResponse<T>;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data;
  }
  return body as T;
});