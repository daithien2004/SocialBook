import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb_access_token')?.value;

  if (!token) {
    return NextResponse.json({ ok: false, token: null }, { status: 401 });
  }

  try {
    const backendUrl =
      process.env.NEST_API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_NEST_API_URL ||
      'http://localhost:5000/api';

    const res = await fetch(`${backendUrl}/auth/ws-ticket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, token: null }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, ticket: data.data.ticket });
  } catch {
    return NextResponse.json({ ok: false, token: null }, { status: 500 });
  }
}
