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

function serializeRelayBody(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === 'string') return data.length > 0 ? data : null;
  return JSON.stringify(data);
}

export async function relayAuthRequest(
  request: NextRequest,
  target: RelayTarget,
): Promise<NextResponse> {
  const method = target.method ?? (request.method as 'GET' | 'POST');
  const isBodyless = method === 'GET';
  const body = isBodyless ? undefined : await request.text();

  try {
    const response = await serverApi.request({
      method,
      url: target.url,
      data: body,
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        'x-csrf-token': request.headers.get('x-csrf-token') ?? '',
        'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '127.0.0.1',
        ...(body != null ? { 'content-type': 'application/json' } : {}),
      },
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const relayBody = serializeRelayBody(response.data);

    const next =
      relayBody == null
        ? new NextResponse(null, { status: response.status })
        : new NextResponse(relayBody, { status: response.status });

    if (relayBody != null) {
      next.headers.set('Content-Type', 'application/json; charset=utf-8');
    }

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
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `[Auth Proxy] Connection error to backend ${target.url}:`,
      reason,
    );
    return NextResponse.json(
      { message: 'Backend service is starting up or unavailable. Please try again later.' },
      { status: 503 },
    );
  }
}
