import { GoogleOAuthStrategy } from '@/infrastructure/auth/services/google-oauth.strategy';

const config = {
  get: (k: string, d?: unknown) =>
    k === 'env.GOOGLE_CLIENT_ID'
      ? 'client-id'
      : k === 'env.GOOGLE_CLIENT_SECRET'
        ? 'secret'
        : d,
} as never;

describe('GoogleOAuthStrategy', () => {
  it('builds authorize URL with state + S256 challenge', async () => {
    const s = new GoogleOAuthStrategy(config);
    const url = await s.buildAuthorizeUrl({
      state: 'st',
      codeChallenge: 'ch',
      callbackUrl: '/api/auth/google/callback',
    });
    expect(url).toContain('accounts.google.com');
    expect(url).toContain('code_challenge=ch');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('state=st');
  });
});
