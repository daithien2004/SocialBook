import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SetCookieSpec {
  name: string;
  value: string;
  path: string;
  maxAgeSeconds: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

export interface ClearCookieSpec {
  name: string;
  path: string;
}

const REFRESH_TTL_SECONDS = 7 * 24 * 3600;
const OAUTH_STATE_TTL_SECONDS = 5 * 60;

@Injectable()
export class AuthCookieService {
  private readonly secure: boolean;
  private readonly sameSite: 'lax' | 'strict' | 'none';

  constructor(private readonly config: ConfigService) {
    const prod = this.config.get<string>('env.NODE_ENV') === 'production';
    const explicit = this.config.get<string>('env.AUTH_COOKIE_SECURE');
    this.secure =
      explicit === 'true' || (prod && explicit !== 'false');
    this.sameSite =
      (this.config.get<string>(
        'env.AUTH_COOKIE_SAME_SITE',
        'lax',
      ) as 'lax' | 'strict' | 'none') ?? 'lax';
  }

  accessTokenCookie(token: string): SetCookieSpec {
    return {
      name: 'sb_access_token',
      value: token,
      path: '/',
      maxAgeSeconds: REFRESH_TTL_SECONDS,
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
    };
  }

  refreshTokenCookie(token: string): SetCookieSpec {
    return {
      name: 'sb_refresh_token',
      value: token,
      path: '/api/auth',
      maxAgeSeconds: REFRESH_TTL_SECONDS,
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
    };
  }

  oauthStateCookie(state: string): SetCookieSpec {
    return {
      name: 'sb_oauth_state',
      value: state,
      path: '/api/auth',
      maxAgeSeconds: OAUTH_STATE_TTL_SECONDS,
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
    };
  }

  clearAccessToken(): ClearCookieSpec {
    return { name: 'sb_access_token', path: '/' };
  }

  clearRefreshToken(): ClearCookieSpec {
    return { name: 'sb_refresh_token', path: '/api/auth' };
  }

  clearOauthState(): ClearCookieSpec {
    return { name: 'sb_oauth_state', path: '/api/auth' };
  }
}