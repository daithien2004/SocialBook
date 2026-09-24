import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import {
  OAuthProviderStrategy,
  OAuthProfile,
  OAuthExchangeInput,
} from '@/application/auth/services/oauth-provider.strategy';
import { OAuthProviderError } from '@/domain/auth/exceptions/oauth-exceptions';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

@Injectable()
export class GoogleOAuthStrategy implements OAuthProviderStrategy {
  readonly provider = 'google' as const;

  constructor(private readonly config: ConfigService) {}

  buildAuthorizeUrl(params: {
    state: string;
    codeChallenge: string;
    callbackUrl: string;
  }): Promise<string> {
    const search = new URLSearchParams({
      client_id: this.config.get<string>('env.GOOGLE_CLIENT_ID') ?? '',
      redirect_uri: params.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state: params.state,
      code_challenge: params.codeChallenge,
      code_challenge_method: 'S256',
    });
    return Promise.resolve(`${AUTH_ENDPOINT}?${search.toString()}`);
  }

  async exchangeCode(input: OAuthExchangeInput): Promise<OAuthProfile> {
    const body = new URLSearchParams({
      code: input.code,
      client_id: this.config.get<string>('env.GOOGLE_CLIENT_ID') ?? '',
      client_secret: this.config.get<string>('env.GOOGLE_CLIENT_SECRET') ?? '',
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: input.codeVerifier,
    });

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      throw new OAuthProviderError(
        'google',
        new Error(`token exchange ${res.status}`),
      );
    }
    const token = (await res.json()) as { id_token: string };
    const client = new OAuth2Client(
      this.config.get<string>('env.GOOGLE_CLIENT_ID'),
    );
    const ticket = await client.verifyIdToken({
      idToken: token.id_token,
      audience: this.config.get<string>('env.GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new OAuthProviderError('google', new Error('missing sub/email'));
    }
    return {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name,
      image: payload.picture,
    };
  }
}
