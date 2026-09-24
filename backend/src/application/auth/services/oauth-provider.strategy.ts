export interface OAuthProfile {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
}

export interface OAuthExchangeInput {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export abstract class OAuthProviderStrategy {
  abstract readonly provider: 'google' | 'github';
  abstract buildAuthorizeUrl(params: {
    state: string;
    codeChallenge: string;
    callbackUrl: string;
  }): Promise<string>;
  abstract exchangeCode(input: OAuthExchangeInput): Promise<OAuthProfile>;
}