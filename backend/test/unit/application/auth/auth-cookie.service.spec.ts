import { AuthCookieService } from '@/application/auth/services/auth-cookie.service';

describe('AuthCookieService', () => {
  const config = {
    get: (k: string, d?: unknown) =>
      k === 'env.REFRESH_TOKEN_EXPIRES_IN'
        ? '7d'
        : k === 'env.NODE_ENV'
          ? 'test'
          : k === 'env.AUTH_COOKIE_SECURE'
            ? 'false'
            : k === 'env.AUTH_COOKIE_SAME_SITE'
              ? 'lax'
              : d,
  } as never;
  const service = new AuthCookieService(config);

  it('access cookie lives refresh lifetime, httpOnly path=/', () => {
    const c = service.accessTokenCookie('tok');
    expect(c.name).toBe('sb_access_token');
    expect(c.httpOnly).toBe(true);
    expect(c.path).toBe('/');
    expect(c.maxAgeSeconds).toBe(7 * 24 * 3600);
  });

  it('refresh + oauth cookies scoped to /api/auth', () => {
    expect(service.refreshTokenCookie('r').path).toBe('/api/auth');
    expect(service.oauthStateCookie('s').path).toBe('/api/auth');
    expect(service.oauthStateCookie('s').maxAgeSeconds).toBe(300);
  });
});
