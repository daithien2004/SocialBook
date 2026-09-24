import { OAuthFlowState } from '@/domain/auth/tokens/oauth-state.vo';

describe('OAuthFlowState', () => {
  it('accepts a relative same-origin callbackUrl', () => {
    const s = new OAuthFlowState('google', 'v1', '/');
    expect(s.callbackUrl).toBe('/');
  });
  it('rejects open-redirect callbackUrl', () => {
    expect(() => new OAuthFlowState('google', 'v1', '//evil.com')).toThrow();
    expect(
      () => new OAuthFlowState('google', 'v1', 'https://evil.com'),
    ).toThrow();
    expect(() => new OAuthFlowState('google', 'v1', '/\\evil.com')).toThrow();
  });
});
