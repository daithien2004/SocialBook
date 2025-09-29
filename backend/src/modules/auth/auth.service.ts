import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(email: string, password: string) {
    const hash = await argon2.hash(password);
    const user = await this.usersService.create({
      email,
      password: hash,
    });

    return this.signTokens(user._id.toString(), user.email);
  }

  async login(user: any) {
    const payload = { email: user.email, id: user._id };
    return this.signTokens(payload.id,payload.email);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const pwMatches = await argon2.verify(user.password, password);
    if (!pwMatches) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, { hashedRt: null });
    return { message: 'Logged out successfully' };
  }

  async signTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

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

    const hashedRt = await argon2.hash(refreshToken);
    await this.usersService.updateRefreshToken(userId, { hashedRt });

    return { accessToken, refreshToken };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRt) throw new ForbiddenException('Access denied');

    const rtMatches = await argon2.verify(user.hashedRt, refreshToken);
    if (!rtMatches) throw new ForbiddenException('Access denied');

    return this.signTokens(user._id.toString(), user.email);
  }
}
