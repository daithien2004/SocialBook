import { cache } from 'react';

import { env } from '@/env';

const NEST_API_URL = env.NEXT_PUBLIC_NEST_API_URL;

interface RawApiResponse<T> {
  message?: string;
  data?: T;
  meta?: unknown;
  warning?: string;
}

export const serverApiRequest = cache(async <T>(path: string): Promise<T> => {
  const res = await fetch(`${NEST_API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Server fetch failed: ${res.status} ${path}`);
  }
  const body = (await res.json()) as RawApiResponse<T>;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data;
  }
  return body as T;
});