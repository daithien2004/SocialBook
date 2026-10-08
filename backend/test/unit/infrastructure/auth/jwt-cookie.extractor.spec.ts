import { accessTokenFromRequest } from '@/modules/auth/infrastructure/auth/strategies/jwt.strategy';

describe('accessTokenFromRequest', () => {
  it('extracts from bearer header', () => {
    const req = {
      headers: { authorization: 'Bearer header-tok' },
    };
    expect(accessTokenFromRequest(req as never)).toBe('header-tok');
  });
  it('null when nothing present', () => {
    expect(accessTokenFromRequest({ cookies: {}, headers: {} })).toBeNull();
  });
});
