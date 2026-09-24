import { NextRequest, NextResponse } from 'next/server';
import { relayAuthRequest } from '@/lib/auth-proxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return relayAuthRequest(request, { url: '/auth/me' });
}