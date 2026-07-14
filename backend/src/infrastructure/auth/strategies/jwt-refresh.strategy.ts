import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookie = req?.cookies?.['refresh_token'] as string | undefined;
          if (cookie) return cookie;
          const body = req?.body as Record<string, unknown> | undefined;
          if (body?.refreshToken && typeof body.refreshToken === 'string')
            return body.refreshToken;
          const header = req?.headers['x-refresh-token'] as string | undefined;
          return header ?? null;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('env.JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: JwtPayload,
  ): JwtPayload & { refreshToken?: string } {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    return { ...payload, refreshToken };
  }
}
