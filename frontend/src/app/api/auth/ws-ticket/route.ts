import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/env';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb_access_token')?.value;

  if (!token) {
    return NextResponse.json({ ok: false, token: null }, { status: 401 });
  }

  try {
    const backendUrl =
      env.NEST_API_INTERNAL_URL || env.NEXT_PUBLIC_NEST_API_URL;

    const res = await fetch(`${backendUrl}/auth/ws-ticket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, token: null }, { status: 401 });
    }

    const body: unknown = await res.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('ticket' in body) ||
      typeof body.ticket !== 'string'
    ) {
      return NextResponse.json({ ok: false, token: null }, { status: 502 });
    }

    return NextResponse.json({ ok: true, ticket: body.ticket });
  } catch {
    return NextResponse.json({ ok: false, token: null }, { status: 500 });
  }
}
