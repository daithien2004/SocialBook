import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';

export function refreshTokenFromRequest(req: {
  cookies?: Record<string, string | undefined>;
  body?: Record<string, string | undefined>;
}): string | null {
  const cookie = req?.cookies?.['sb_refresh_token'];
  if (cookie) return cookie;
  const body = ExtractJwt.fromBodyField('refreshToken')(req);
  return body;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: refreshTokenFromRequest,
      secretOrKey: configService.getOrThrow<string>('env.JWT_REFRESH_SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
