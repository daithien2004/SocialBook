import { env } from '@/env';
import { getCsrfToken } from '@/lib/utils';

let inFlightRefresh: Promise<boolean> | null = null;

async function requestRefresh(): Promise<boolean> {
  try {
    const csrfToken = getCsrfToken();
    const res = await fetch(`${env.NEXT_PUBLIC_NEST_API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: '{}',
    });
    return res.status < 400;
  } catch {
    return false;
  }
}

export function refreshAuthSession(): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = requestRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}
