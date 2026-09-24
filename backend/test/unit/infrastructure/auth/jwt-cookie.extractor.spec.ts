import { accessTokenFromRequest } from '@/infrastructure/auth/strategies/jwt.strategy';

describe('accessTokenFromRequest', () => {
  it('prefers sb_access_token cookie', () => {
    const req = {
      cookies: { sb_access_token: 'cookie-tok' },
      headers: { authorization: 'Bearer header-tok' },
    };
    expect(accessTokenFromRequest(req as never)).toBe('cookie-tok');
  });
  it('falls back to bearer header', () => {
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer header-tok' },
    };
    expect(accessTokenFromRequest(req as never)).toBe('header-tok');
  });
  it('null when nothing present', () => {
    expect(
      accessTokenFromRequest({ cookies: {}, headers: {} } as never),
    ).toBeNull();
  });
});