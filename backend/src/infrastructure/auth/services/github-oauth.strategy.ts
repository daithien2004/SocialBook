import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAuthProviderStrategy,
  OAuthProfile,
  OAuthExchangeInput,
} from '@/application/auth/services/oauth-provider.strategy';
import { OAuthProviderError } from '@/domain/auth/exceptions/oauth-exceptions';

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const AUTH_ENDPOINT = 'https://github.com/login/oauth/authorize';
const API = 'https://api.github.com';

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}
interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

@Injectable()
export class GitHubOAuthStrategy implements OAuthProviderStrategy {
  readonly provider = 'github' as const;

  constructor(private readonly config: ConfigService) {}

  buildAuthorizeUrl(params: {
    state: string;
    codeChallenge: string;
    callbackUrl: string;
  }): Promise<string> {
    const search = new URLSearchParams({
      client_id: this.config.get<string>('env.GITHUB_CLIENT_ID') ?? '',
      redirect_uri: params.callbackUrl,
      response_type: 'code',
      scope: 'read:user user:email',
      state: params.state,
    });
    return Promise.resolve(`${AUTH_ENDPOINT}?${search.toString()}`);
  }

  async exchangeCode(input: OAuthExchangeInput): Promise<OAuthProfile> {
    const body = new URLSearchParams({
      client_id: this.config.get<string>('env.GITHUB_CLIENT_ID') ?? '',
      client_secret: this.config.get<string>('env.GITHUB_CLIENT_SECRET') ?? '',
      redirect_uri: input.redirectUri,
      code: input.code,
    });
    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });
    if (!res.ok) {
      throw new OAuthProviderError(
        'github',
        new Error(`token exchange ${res.status}`),
      );
    }
    const token = (await res.json()) as { access_token: string };
    const [userRes, emailsRes] = await Promise.all([
      fetch(`${API}/user`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'User-Agent': 'socialbook',
        },
      }),
      fetch(`${API}/user/emails`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'User-Agent': 'socialbook',
        },
      }),
    ]);
    if (!userRes.ok) {
      throw new OAuthProviderError(
        'github',
        new Error(`profile ${userRes.status}`),
      );
    }
    const user = (await userRes.json()) as GitHubUser;
    let email = user.email ?? null;
    let emailVerified = false;
    if (!email && emailsRes.ok) {
      const emails = (await emailsRes.json()) as GitHubEmail[];
      const chosen = emails.find((e) => e.primary) ?? emails[0];
      if (chosen) {
        email = chosen.email;
        emailVerified = chosen.verified === true;
      }
    }
    if (!email) {
      throw new OAuthProviderError('github', new Error('no verified email'));
    }
    return {
      provider: 'github',
      providerId: String(user.id),
      email,
      emailVerified,
      name: user.name ?? user.login,
      image: user.avatar_url,
    };
  }
}
