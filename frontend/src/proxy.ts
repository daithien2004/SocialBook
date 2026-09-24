import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest): NextResponse {
  const hasAccessCookie = request.cookies.get('sb_access_token');
  if (!hasAccessCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};