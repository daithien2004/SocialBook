import { OAuthProviderError } from '@/domain/auth/exceptions/oauth-exceptions';

describe('OAuthProviderError', () => {
  it('carries provider + cause for OAuthFailed mapping', () => {
    const err = new OAuthProviderError('google', new Error('token exchange 400'));
    expect(err.cause.message).toContain('exchange');
    expect(err.provider).toBe('google');
  });
});