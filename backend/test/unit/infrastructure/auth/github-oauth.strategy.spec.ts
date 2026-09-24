import { GitHubOAuthStrategy } from '@/infrastructure/auth/services/github-oauth.strategy';

const config = {
  get: (k: string, d?: unknown) =>
    k === 'env.GITHUB_CLIENT_ID'
      ? 'gh-id'
      : k === 'env.GITHUB_CLIENT_SECRET'
        ? 'gh-secret'
        : d,
} as never;

describe('GitHubOAuthStrategy', () => {
  it('requests read:user user:email scopes', async () => {
    const s = new GitHubOAuthStrategy(config);
    const url = await s.buildAuthorizeUrl({
      state: 'st',
      codeChallenge: 'ch',
      callbackUrl: '/api/auth/github/callback',
    });
    expect(url).toContain('github.com/login/oauth/authorize');
    expect(decodeURIComponent(url)).toContain('read:user');
    expect(decodeURIComponent(url)).toContain('user:email');
  });
});
