import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/lib/server-api';

export interface RelayTarget {
  method?: 'GET' | 'POST';
  url: string;
}

function getSetCookies(headers: Record<string, unknown>): string[] {
  const raw = headers['set-cookie'];
  if (!raw) return [];
  return Array.isArray(raw)
    ? raw.filter((c): c is string => typeof c === 'string')
    : [raw as string];
}

export async function relayAuthRequest(
  request: NextRequest,
  target: RelayTarget,
): Promise<NextResponse> {
  const method = target.method ?? (request.method as 'GET' | 'POST');
  const isBodyless = method === 'GET';
  const body = isBodyless ? undefined : await request.text();

  const response = await serverApi.request({
    method,
    url: target.url,
    data: body,
    headers: {
      cookie: request.headers.get('cookie') ?? '',
      ...(body != null ? { 'content-type': 'application/json' } : {}),
    },
    maxRedirects: 0,
    validateStatus: (status: number) => status >= 200 && status < 400,
  });

  const next = new NextResponse(null, { status: response.status });

  for (const cookie of getSetCookies(
    response.headers as unknown as Record<string, unknown>,
  )) {
    next.headers.append('set-cookie', cookie);
  }

  const location = response.headers?.['location'] as string | undefined;
  if (location) {
    next.headers.set('location', location);
  }

  return next;
}