import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
  

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // Check if user is banned in database
    const user = await this.usersService.findById(payload.sub);

    if (user?.isBanned) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
        error: 'USER_BANNED',
      });
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

