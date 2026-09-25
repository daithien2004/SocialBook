import { NextRequest, NextResponse } from 'next/server';
import { relayAuthRequest } from '@/lib/auth-proxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const search = request.nextUrl.search;
  return relayAuthRequest(request, { url: `/auth/github${search}` });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const search = request.nextUrl.search;
  return relayAuthRequest(request, { url: `/auth/github${search}` });
}
