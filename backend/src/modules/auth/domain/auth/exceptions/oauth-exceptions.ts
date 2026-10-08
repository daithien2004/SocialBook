export enum OAuthErrorCode {
  EmailUsedWithPassword = 'EmailUsedWithPassword',
  AccountBanned = 'AccountBanned',
  EmailNotVerified = 'EmailNotVerified',
  OAuthFailed = 'OAuthFailed',
}

export class OAuthProviderError extends Error {
  constructor(
    public readonly provider: 'google' | 'github',
    cause: unknown,
  ) {
    super(`OAuth provider "${provider}" failed`, { cause });
    this.name = 'OAuthProviderError';
  }
}
