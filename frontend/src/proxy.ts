import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const ACCESS_COOKIE = 'sb_access_token';
const REFRESH_COOKIE = 'sb_refresh_token';
const CSRF_SECRET_COOKIE = 'sb_csrf_secret';
const CSRF_TOKEN_COOKIE = 'sb_csrf_token';

const getAccessSecret = (): Uint8Array =>
  new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'secret');

const extractSetCookie = (
  setCookies: readonly string[],
  name: string,
): string | undefined => {
  const prefix = `${name}=`;
  for (const raw of setCookies) {
    const pair = raw.split(';')[0];
    if (!pair?.startsWith(prefix)) continue;
    const value = pair.slice(prefix.length).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const csrfSecret = request.cookies.get(CSRF_SECRET_COOKIE)?.value;
  const csrfToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;

  let jwtPayload: jose.JWTPayload | null = null;
  let setCookies: string[] = [];

  // 1. Verify Access Token
  if (accessToken) {
    try {
      const { payload } = await jose.jwtVerify(accessToken, getAccessSecret());
      jwtPayload = payload;
    } catch {
      jwtPayload = null;
    }
  }

  // 2. Silent Refresh if Access Token expired but Refresh Token exists
  if (!jwtPayload && refreshToken) {
    try {
      const backendUrl =
        process.env.NEST_API_INTERNAL_URL ||
        process.env.NEXT_PUBLIC_NEST_API_URL ||
        'http://localhost:5000/api';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const refreshRes = await fetch(`${backendUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `${REFRESH_COOKIE}=${refreshToken}; ${CSRF_SECRET_COOKIE}=${csrfSecret ?? ''}`,
          'x-csrf-token': csrfToken ?? '',
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      setCookies = refreshRes.headers.getSetCookie();

      if (!refreshRes.ok) {
        console.warn(
          `[proxy] silent refresh rejected with status ${refreshRes.status}`,
        );
      } else {
        const rotated = extractSetCookie(setCookies, ACCESS_COOKIE);
        if (rotated) {
          accessToken = rotated;
          const { payload } = await jose.jwtVerify(rotated, getAccessSecret());
          jwtPayload = payload;
        }
      }
    } catch {
      // Ignore
    }
  }

  const requestHeaders = new Headers(request.headers);

  // 3. Inject User Payload for RSC
  if (jwtPayload) {
    requestHeaders.set(
      'x-user-data',
      JSON.stringify({
        id: jwtPayload.sub,
        email: jwtPayload.email,
        role: jwtPayload.role,
      }),
    );

    const originalAccessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    if (accessToken && accessToken !== originalAccessToken) {
      const cookieStr = request.cookies
        .getAll()
        .map((cookie) =>
          cookie.name === ACCESS_COOKIE
            ? `${ACCESS_COOKIE}=${accessToken}`
            : `${cookie.name}=${cookie.value}`,
        )
        .join('; ');
      requestHeaders.set('cookie', cookieStr);
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  for (const cookie of setCookies) {
    response.headers.append('Set-Cookie', cookie);
  }

  // Nếu token hoàn toàn vô hiệu và user truy cập route cần bảo vệ
  if (!jwtPayload && request.nextUrl.pathname.startsWith('/admin')) {
    const redirectRes = NextResponse.redirect(new URL('/login', request.url));
    for (const cookie of setCookies) {
      redirectRes.headers.append('Set-Cookie', cookie);
    }
    return redirectRes;
  }

  return response;
}

export const config = {
  // Thay đổi matcher để proxy chạy trên tất cả các route (trừ file tĩnh)
  // để đảm bảo x-user-data luôn được inject cho getServerMe
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
