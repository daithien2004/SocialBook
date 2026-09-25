import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let accessToken = request.cookies.get('sb_access_token')?.value;
  const refreshToken = request.cookies.get('sb_refresh_token')?.value;

  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  let isTokenValid = false;
  let jwtPayload: jose.JWTPayload | null = null;

  // 1. Verify Access Token
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'secret');
      const { payload } = await jose.jwtVerify(accessToken, secret);
      isTokenValid = true;
      jwtPayload = payload;
    } catch (error) {
      isTokenValid = false;
    }
  }

  // 2. Silent Refresh if Access Token expired but Refresh Token exists
  if (!isTokenValid && refreshToken) {
    try {
      const backendUrl = process.env.NEST_API_INTERNAL_URL || process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:4000/api';
      const refreshRes = await fetch(`${backendUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sb_refresh_token=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const setCookies = refreshRes.headers.getSetCookie();
        for (const cookie of setCookies) {
          response.headers.append('Set-Cookie', cookie);
        }

        const body = await refreshRes.json();
        if (body.data?.accessToken) {
           accessToken = body.data.accessToken;
           
           const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'secret');
           const { payload } = await jose.jwtVerify(accessToken as string, secret);
           jwtPayload = payload;
           isTokenValid = true;
           
           const requestHeaders = new Headers(request.headers);
           const currentCookies = request.cookies.getAll();
           const newCookieStr = currentCookies
             .map(c => `${c.name}=${c.name === 'sb_access_token' ? accessToken : c.value}`)
             .join('; ');
             
           requestHeaders.set('cookie', newCookieStr);
           
           const nextRes = NextResponse.next({
             request: { headers: requestHeaders },
           });
           
           for (const cookie of setCookies) {
             nextRes.headers.append('Set-Cookie', cookie);
           }
           
           nextRes.headers.set('x-user-data', JSON.stringify({
             id: payload.sub,
             email: payload.email,
             role: payload.role,
           }));
           
           return nextRes;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // 3. Inject User Payload for RSC
  if (isTokenValid && jwtPayload) {
    requestHeaders.set('x-user-data', JSON.stringify({
      id: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role,
    }));
  } else {
    // Nếu token hoàn toàn vô hiệu và user truy cập route cần bảo vệ
    if (request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  // Thay đổi matcher để proxy chạy trên tất cả các route (trừ file tĩnh)
  // để đảm bảo x-user-data luôn được inject cho getServerMe
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};