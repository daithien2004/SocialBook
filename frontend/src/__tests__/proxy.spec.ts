/** @jest-environment node */
import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { proxy } from '@/proxy';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const jwtVerify = jose.jwtVerify as unknown as jest.Mock;

const ORIGINAL_ENV = process.env.NEST_API_INTERNAL_URL;

const EXPIRED = 'expired-access';
const ROTATED = 'rotated-access';
const VALID = 'valid-access';

const VALID_PAYLOAD = { sub: 'u1', email: 'a@b.co', role: 'user' };
const EXPECTED_USER_DATA = { id: 'u1', email: 'a@b.co', role: 'user' };

const CSRF_COOKIES = {
  sb_csrf_secret: 'secret-1',
  sb_csrf_token: 'token-1',
};

function makeRequest(
  cookies: Record<string, string>,
  path = '/',
): NextRequest {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return new NextRequest(`http://localhost${path}`, {
    headers: { cookie },
  });
}

function makeRefreshResponse(
  status: number,
  body: unknown,
  setCookies: string[] = [],
): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of setCookies) {
    headers.append('Set-Cookie', cookie);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function requestHeader(res: Response, name: string): string | null {
  const overridden = res.headers.get('x-middleware-override-headers');
  if (!overridden?.split(',').includes(name)) return null;
  return res.headers.get(`x-middleware-request-${name}`);
}

describe('proxy silent refresh', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    process.env.NEST_API_INTERNAL_URL = 'http://backend:5000/api';
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    jwtVerify.mockImplementation(async (token: string) => {
      if (token === ROTATED || token === VALID) {
        return { payload: VALID_PAYLOAD };
      }
      throw new Error('jwt expired');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (ORIGINAL_ENV === undefined) {
      delete process.env.NEST_API_INTERNAL_URL;
    } else {
      process.env.NEST_API_INTERNAL_URL = ORIGINAL_ENV;
    }
  });

  function refreshCall() {
    const call = mockFetch.mock.calls.find(
      ([url]) => typeof url === 'string' && url.includes('/auth/refresh'),
    );
    if (!call) throw new Error('refresh was never called');
    return call[1] as RequestInit & { headers: Record<string, string> };
  }

  it('sends the csrf header and both cookies to the refresh endpoint', async () => {
    mockFetch.mockResolvedValue(
      makeRefreshResponse(200, { message: 'Làm mới token thành công' }, [
        `sb_access_token=${ROTATED}; Path=/; HttpOnly`,
      ]),
    );

    await proxy(
      makeRequest({
        sb_access_token: EXPIRED,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    const init = refreshCall();
    expect(init.headers['x-csrf-token']).toBe('token-1');
    expect(init.headers.Cookie).toContain('sb_refresh_token=refresh-1');
    expect(init.headers.Cookie).toContain('sb_csrf_secret=secret-1');
  });

  it('forwards Set-Cookie even when the refresh is rejected', async () => {
    mockFetch.mockResolvedValue(
      makeRefreshResponse(403, { message: 'Missing CSRF tokens' }, [
        'sb_csrf_secret=fresh-secret; Path=/; HttpOnly',
        'sb_csrf_token=fresh-token; Path=/',
      ]),
    );

    const res = await proxy(
      makeRequest({
        sb_access_token: EXPIRED,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    const cookies = res.headers.getSetCookie().join('\n');
    expect(cookies).toContain('sb_csrf_secret=fresh-secret');
    expect(cookies).toContain('sb_csrf_token=fresh-token');
  });

  it('does not mark the user as authenticated when refresh fails', async () => {
    mockFetch.mockResolvedValue(makeRefreshResponse(403, { message: 'nope' }));

    const res = await proxy(
      makeRequest({
        sb_access_token: EXPIRED,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    expect(requestHeader(res, 'x-user-data')).toBeNull();
  });

  it('warns when the silent refresh is rejected', async () => {
    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    mockFetch.mockResolvedValue(makeRefreshResponse(403, { message: 'nope' }));

    await proxy(
      makeRequest({
        sb_access_token: EXPIRED,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('403'));
    warn.mockRestore();
  });

  it('injects user data into the request headers from a rotated access token', async () => {
    mockFetch.mockResolvedValue(
      makeRefreshResponse(200, { message: 'Làm mới token thành công' }, [
        `sb_access_token=${ROTATED}; Path=/; HttpOnly`,
      ]),
    );

    const res = await proxy(
      makeRequest({
        sb_access_token: EXPIRED,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    const userData = requestHeader(res, 'x-user-data');
    expect(userData).not.toBeNull();
    expect(JSON.parse(userData as string)).toEqual(EXPECTED_USER_DATA);
  });

  it('rewrites the request cookie with the rotated access token', async () => {
    mockFetch.mockResolvedValue(
      makeRefreshResponse(200, { message: 'Làm mới token thành công' }, [
        `sb_access_token=${ROTATED}; Path=/; HttpOnly`,
      ]),
    );

    const res = await proxy(
      makeRequest({
        sb_access_token: EXPIRED,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    const cookie = requestHeader(res, 'cookie') ?? '';
    expect(cookie).toContain(`sb_access_token=${ROTATED}`);
    expect(cookie).toContain('sb_refresh_token=refresh-1');
    expect(cookie).not.toContain(`sb_access_token=${EXPIRED}`);
  });

  it('ignores an access token leaked in the response body', async () => {
    mockFetch.mockResolvedValue(
      makeRefreshResponse(200, { data: { accessToken: ROTATED } }),
    );

    const res = await proxy(
      makeRequest({
        sb_access_token: EXPIRED,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    expect(requestHeader(res, 'x-user-data')).toBeNull();
  });

  it('injects user data on the fast path when the access token is valid', async () => {
    const res = await proxy(
      makeRequest({
        sb_access_token: VALID,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(requestHeader(res, 'x-user-data')).toBe(
      JSON.stringify(EXPECTED_USER_DATA),
    );
    expect(res.status).toBe(200);
  });

  it('leaves the request cookie untouched on the fast path', async () => {
    const res = await proxy(
      makeRequest({
        sb_access_token: VALID,
        sb_refresh_token: 'refresh-1',
        ...CSRF_COOKIES,
      }),
    );

    const cookie = requestHeader(res, 'cookie') ?? '';
    expect(cookie).toContain(`sb_access_token=${VALID}`);
    expect(cookie).not.toContain(ROTATED);
  });

  it('skips the refresh when there is no refresh token at all', async () => {
    const res = await proxy(
      makeRequest({ sb_access_token: EXPIRED, ...CSRF_COOKIES }),
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(requestHeader(res, 'x-user-data')).toBeNull();
  });

  it('redirects protected admin routes to login when no token can be obtained', async () => {
    mockFetch.mockResolvedValue(makeRefreshResponse(403, { message: 'nope' }));

    const res = await proxy(
      makeRequest(
        {
          sb_access_token: EXPIRED,
          sb_refresh_token: 'refresh-1',
          ...CSRF_COOKIES,
        },
        '/admin/dashboard',
      ),
    );

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('keeps refreshed cookies on the admin redirect', async () => {
    mockFetch.mockResolvedValue(
      makeRefreshResponse(403, { message: 'nope' }, [
        'sb_csrf_secret=fresh-secret; Path=/; HttpOnly',
      ]),
    );

    const res = await proxy(
      makeRequest(
        {
          sb_access_token: EXPIRED,
          sb_refresh_token: 'refresh-1',
          ...CSRF_COOKIES,
        },
        '/admin',
      ),
    );

    expect(res.headers.getSetCookie().join('\n')).toContain(
      'sb_csrf_secret=fresh-secret',
    );
  });

  it('does not redirect public routes when the session is gone', async () => {
    mockFetch.mockResolvedValue(makeRefreshResponse(403, { message: 'nope' }));

    const res = await proxy(makeRequest({ sb_access_token: EXPIRED }, '/books'));

    expect(res.status).toBe(200);
  });
});
