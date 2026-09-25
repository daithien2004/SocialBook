import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { Logger } from '@/shared/logger';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: IUserRepository,
    private readonly logger: Logger,
    private readonly passwordHasher: IPasswordHasher,
  ) {
    this.logger.setContext(TokenService.name);
  }

  async signTokens(
    userId: string, 
    email: string, 
    role: string, 
    ip?: string, 
    userAgent?: string
  ) {
    const payload = { sub: userId, email, role };

    const accessSecret = this.configService.get<string>(
      'env.JWT_ACCESS_SECRET',
    );
    const refreshSecret = this.configService.get<string>(
      'env.JWT_REFRESH_SECRET',
    );

    if (!accessSecret || !refreshSecret) {
      this.logger.error(
        'JWT secrets not configured - check JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables',
      );
      throw new InternalServerErrorException('JWT secrets chưa được cấu hình');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: this.configService.get<string>(
          'env.ACCESS_TOKEN_EXPIRES_IN',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>(
          'env.REFRESH_TOKEN_EXPIRES_IN',
          '7d',
        ),
      }),
    ]);

    const hashedRt = await this.passwordHasher.hash(refreshToken);

    // Update hashed RT and Login Context
    const id = UserId.create(userId);
    const user = await this.userRepository.findById(id);
    if (user) {
      user.updateHashedRt(hashedRt);
      user.updateLastLoginContext(ip, userAgent);
      await this.userRepository.save(user);
    }

    return { accessToken, refreshToken };
  }

  async signAccessOnly(
    userId: string,
    email: string,
    role: string,
  ): Promise<string> {
    const accessSecret = this.configService.get<string>(
      'env.JWT_ACCESS_SECRET',
    );
    if (!accessSecret) {
      this.logger.error(
        'JWT access secret not configured - check JWT_ACCESS_SECRET environment variable',
      );
      throw new InternalServerErrorException('JWT secrets chưa được cấu hình');
    }
    return this.jwtService.signAsync(
      { sub: userId, email, role },
      {
        secret: accessSecret,
        expiresIn: this.configService.get<string>(
          'env.ACCESS_TOKEN_EXPIRES_IN',
          '15m',
        ),
      },
    );
  }
}
