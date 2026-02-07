import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { UserId } from '../../../users/domain/value-objects/user-id.vo';
  

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // Check if user is banned in database
    const userId = UserId.create(payload.sub);
    const user = await this.userRepository.findById(userId);

    if (!user) {
        throw new UnauthorizedException();
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
        error: 'USER_BANNED',
      });
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

