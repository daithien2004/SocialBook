import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { IRoleRepository } from '@/modules/roles/domain/public-api';
import { ICachePort } from '@/shared/domain/cache.port';
import {
  AUTH_USER_CACHE_TTL_SECONDS,
  getAuthUserCacheKey,
} from '@/shared/platform/cache/auth-cache.keys';
import { UserId } from '@/modules/users/domain/public-api';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function accessTokenFromRequest(req: {
  cookies?: Record<string, string | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}): string | null {
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

interface AuthUserCache {
  role: string;
  isBanned: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly cache: ICachePort,
  ) {
    super({
      jwtFromRequest: accessTokenFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('env.JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub;
    const cacheKey = getAuthUserCacheKey(userId);

    const cached = await this.cache.get<AuthUserCache>(cacheKey);
    if (cached) {
      if (cached.isBanned) {
        this.throwBanned();
      }
      return { id: userId, email: payload.email, role: cached.role };
    }

    const user = await this.userRepository.findById(UserId.create(userId));

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.isBanned) {
      this.throwBanned();
    }

    const role = user.roleId ? await this.resolveRoleName(user.roleId) : 'user';

    await this.cache.set(
      cacheKey,
      { role, isBanned: user.isBanned },
      AUTH_USER_CACHE_TTL_SECONDS,
    );

    return { id: userId, email: payload.email, role };
  }

  private async resolveRoleName(roleId: string): Promise<string> {
    const role = await this.roleRepository.findById(roleId);
    return role ? role.name : 'user';
  }

  private throwBanned(): never {
    throw new ForbiddenException({
      code: 'USER_BANNED',
      message: 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
    });
  }
}
