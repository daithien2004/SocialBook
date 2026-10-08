import { CommandBus } from '@nestjs/cqrs';
import {
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
  Req,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { OAuthProviderStrategy } from '@/modules/auth/application/auth/services/oauth-provider.strategy';
import { OAuthStateService } from '@/modules/auth/application/auth/services/oauth-state.service';
import { OAuthAuthCommand } from '@/modules/auth/application/auth/commands/oauth-auth/oauth-auth.command';
import {
  AuthCookieService,
  SetCookieSpec,
} from '@/modules/auth/application/auth/services/auth-cookie.service';
import {
  OAuthErrorCode,
  OAuthProviderError,
} from '@/modules/auth/domain/auth/exceptions/oauth-exceptions';
import {
  UnauthorizedDomainException,
  UserBannedDomainException,
} from '@/modules/auth/domain/auth/exceptions/auth-exceptions';
import { ApiResponse } from '@nestjs/swagger';

export function toErrorCode(error: unknown): OAuthErrorCode {
  if (error instanceof ConflictException)
    return OAuthErrorCode.EmailUsedWithPassword;
  if (error instanceof UserBannedDomainException)
    return OAuthErrorCode.AccountBanned;
  if (error instanceof UnauthorizedDomainException)
    return OAuthErrorCode.EmailNotVerified;
  if (error instanceof OAuthProviderError) return OAuthErrorCode.OAuthFailed;
  return OAuthErrorCode.OAuthFailed;
}

@Controller('auth')
export class OAuthController {
  constructor(
    private readonly commandBus: CommandBus,

    @Inject(OAuthProviderStrategy)
    private readonly strategies: OAuthProviderStrategy[],
    private readonly oauthStateService: OAuthStateService,
    private readonly cookieService: AuthCookieService,
    private readonly config: ConfigService,
  ) {}

  private strategy(provider: 'google' | 'github'): OAuthProviderStrategy {
    const found = this.strategies.find((s) => s.provider === provider);
    if (!found)
      throw new NotFoundException(
        `OAuth provider ${provider} chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh`,
      );
    return found;
  }

  private providerRedirectUri(provider: 'google' | 'github'): string {
    const key =
      provider === 'google'
        ? 'env.GOOGLE_CALLBACK_URL'
        : 'env.GITHUB_CALLBACK_URL';
    return this.config.get<string>(key) ?? '';
  }

  private frontendBase(): string {
    return this.config.get<string>('env.FRONTEND_URL', 'http://localhost:3000');
  }

  private redirectWithQuery(path: string, key: string, value: string): string {
    const dest = new URL(path, this.frontendBase());
    dest.searchParams.set(key, value);
    return dest.toString();
  }

  private errorRedirect(code: OAuthErrorCode): string {
    return this.redirectWithQuery('/login', 'error', code);
  }

  private applyCookie(res: Response, spec: SetCookieSpec): void {
    res.cookie(spec.name, spec.value, {
      path: spec.path,
      maxAge: spec.maxAgeSeconds * 1000,
      httpOnly: spec.httpOnly,
      secure: spec.secure,
      sameSite: spec.sameSite,
    });
  }

  private clearOauthStateCookie(res: Response): void {
    const spec = this.cookieService.clearOauthState();
    res.clearCookie(spec.name, { path: spec.path });
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('google')
  @ApiResponse({
    status: 302,
    description: 'Redirects the browser to the Google authorization page.',
    headers: { Location: { schema: { type: 'string', format: 'uri' } } },
  })
  startGoogle(
    @Query('callbackUrl') callbackUrl: string | undefined,
    @Res() res: Response,
  ) {
    return this.start('google', callbackUrl, res);
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('github')
  @ApiResponse({
    status: 302,
    description: 'Redirects the browser to the GitHub authorization page.',
    headers: { Location: { schema: { type: 'string', format: 'uri' } } },
  })
  startGithub(
    @Query('callbackUrl') callbackUrl: string | undefined,
    @Res() res: Response,
  ) {
    return this.start('github', callbackUrl, res);
  }

  private async start(
    provider: 'google' | 'github',
    callbackUrl: string | undefined,
    res: Response,
  ) {
    try {
      const strat = this.strategy(provider);
      const flow = await this.oauthStateService.beginFlow(
        provider,
        callbackUrl ?? '/login',
      );
      this.applyCookie(res, this.cookieService.oauthStateCookie(flow.state));
      const authUrl = await strat.buildAuthorizeUrl({
        state: flow.state,
        codeChallenge: flow.codeChallenge,
        callbackUrl: this.providerRedirectUri(provider),
      });
      res.redirect(302, authUrl);
      return;
    } catch {
      res.redirect(302, this.errorRedirect(OAuthErrorCode.OAuthFailed));
      return;
    }
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('google/callback')
  @ApiResponse({
    status: 302,
    description: 'Redirects the browser to the frontend OAuth result page.',
    headers: { Location: { schema: { type: 'string', format: 'uri' } } },
  })
  callbackGoogle(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.callback('google', code, state, req, res);
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('github/callback')
  @ApiResponse({
    status: 302,
    description: 'Redirects the browser to the frontend OAuth result page.',
    headers: { Location: { schema: { type: 'string', format: 'uri' } } },
  })
  callbackGithub(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.callback('github', code, state, req, res);
  }

  private async callback(
    provider: 'google' | 'github',
    code: string | undefined,
    state: string | undefined,
    req: Request,
    res: Response,
  ) {
    const cookieState = req.cookies?.sb_oauth_state as string | undefined;
    if (!cookieState || cookieState !== state || !code) {
      this.clearOauthStateCookie(res);
      res.redirect(302, this.errorRedirect(OAuthErrorCode.OAuthFailed));
      return;
    }
    this.clearOauthStateCookie(res);
    try {
      const strat = this.strategy(provider);
      const redirectUri = this.providerRedirectUri(provider);
      const flow = await this.oauthStateService.getConsumedFlow(state);
      if (!flow) {
        res.redirect(302, this.errorRedirect(OAuthErrorCode.OAuthFailed));
        return;
      }
      const profile = await strat.exchangeCode({
        code,
        codeVerifier: flow.codeVerifier,
        redirectUri,
      });
      const result = await this.commandBus.execute(
        new OAuthAuthCommand(profile),
      );

      this.applyCookie(
        res,
        this.cookieService.refreshTokenCookie(result.refreshToken),
      );
      res.redirect(
        302,
        this.redirectWithQuery(flow.callbackUrl, 'oauth', 'success'),
      );
      return;
    } catch (error: unknown) {
      res.redirect(302, this.errorRedirect(toErrorCode(error)));
      return;
    }
  }
}
