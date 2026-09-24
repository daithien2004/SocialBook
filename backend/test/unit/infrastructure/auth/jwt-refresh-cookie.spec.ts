import { refreshTokenFromRequest } from '@/infrastructure/auth/strategies/jwt-refresh.strategy';

describe('refreshTokenFromRequest', () => {
  it('reads sb_refresh_token cookie first', () => {
    const req = {
      cookies: { sb_refresh_token: 'cookie-r' },
      body: { refreshToken: 'body-r' },
    };
    expect(refreshTokenFromRequest(req as never)).toBe('cookie-r');
  });
  it('falls back to body', () => {
    const req = { cookies: {}, body: { refreshToken: 'body-r' } };
    expect(refreshTokenFromRequest(req as never)).toBe('body-r');
  });
  it('null when nothing present', () => {
    expect(
      refreshTokenFromRequest({ cookies: {}, body: {} } as never),
    ).toBeNull();
  });
});