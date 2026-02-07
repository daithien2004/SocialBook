
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '@/src/modules/users/domain/repositories/user.repository.interface';
import { UserId } from '@/src/modules/users/domain/value-objects/user-id.vo';
import { Logger } from '@/src/shared/logger';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: IUserRepository,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(TokenService.name);
  }

  async signTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      this.logger.error('JWT secrets not configured - check JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables');
      throw new InternalServerErrorException('JWT secrets chưa được cấu hình');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    const hashedRt = await bcrypt.hash(refreshToken, 10);
    
    // Update hashed RT
    const id = UserId.create(userId);
    const user = await this.userRepository.findById(id);
    if (user) {
        user.updateHashedRt(hashedRt);
        await this.userRepository.save(user);
    }

    return { accessToken, refreshToken };
  }

  /* Note: validateRefreshToken logic from AuthService was tightly coupled with Refresh logic. 
     Moving it to RefreshTokenUseCase or keeping helper here. */
}
