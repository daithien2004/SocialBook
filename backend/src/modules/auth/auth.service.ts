import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { OtpService } from '../otp/otp.service';
import { SignupGoogleDto, SignupLocalDto } from './dto/auth.dto';

// FORMAT CHUẨN cho mỗi method:
// 1. Input validation
// 2. Business rules validation
// 3. Execute business logic
// 4. Side effects (logging, events, etc.)
// 5. Return formatted response

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
  ) {}

  async login(user: any) {
    // VALIDATION
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account has not been verified');
    }

    // EXECUTION
    const tokens = await this.signTokens(user.id.toString(), user.email);

    // RETURN
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      },
    };
  }

  async logout(userId: string) {
    // EXECUTION
    await this.usersService.updateRefreshToken(userId, { hashedRt: null });
    // RETURN
    return { message: 'Logged out successfully' };
  }

  async signup(dto: SignupLocalDto): Promise<string> {
    // VALIDATION
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      throw new ConflictException('Email already exists');
    }

    // EXECUTION
    const hash = await argon2.hash(dto.password);
    await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: hash,
      provider: 'local',
    });

    // RETURN
    return await this.otpService.generateOTP(dto.email);
  }

  // Endpoint xử lý cả login VÀ signup
  async googleAuth(dto: SignupGoogleDto) {
    // VALIDATION
    let user = await this.usersService.findByEmail(dto.email);

    // EXECUTION
    if (!user) {
      // Chưa có account → TỰ ĐỘNG TẠO MỚI
      user = await this.usersService.create({
        username: dto.username || dto.email.split('@')[0],
        email: dto.email,
        password: undefined, // Không có password
        provider: 'google',
        providerId: dto.googleId,
        avatar: dto.avatar,
        isVerified: true, // Google đã verify rồi
      });
    } else {
      // Đã có account → KIỂM TRA PROVIDER
      if (user.provider === 'local') {
        // User đã đăng ký bằng email/password trước đó
        throw new ConflictException(
          'Email already registered with password. Please login with your password or link your Google account first.',
        );
      }

      // Nếu user.provider === 'google' → Cho phép login
    }

    // EXECUTION
    const tokens = await this.signTokens(user.id.toString(), user.email);

    // RESPONSE
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.username,
        avatar: user.avatar,
      },
    };
  }

  async verifyOtpAndActivate(email: string, otp: string): Promise<string> {
    // VALIDATION
    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // EXECUTION
    user.isVerified = true;
    await user.save();

    // RETURN
    return 'Registration successful';
  }

  async forgotPassword(email: string): Promise<string> {
    // VALIDATION
    const existingUser = await this.usersService.findByEmail(email);
    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    // RETURN
    return this.otpService.generateOTP(email);
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<string> {
    // VALIDATION
    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // EXECUTION
    const hashPassword = await argon2.hash(newPassword);
    user.password = hashPassword;
    await user.save();

    // RETURN
    return 'Password reset successful';
  }

  async validateUser(email: string, password: string) {
    // VALIDATION
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // EXECUTION
    const pwMatches = argon2.verify(user.password!, password);
    if (!pwMatches) throw new UnauthorizedException('Invalid credentials');

    // RETURN
    return user;
  }

  async signTokens(userId: string, email: string) {
    // VALIDATION
    const payload = { sub: userId, email };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException('JWT secrets not configured');
    }

    // EXECUTION
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

    // RETURN
    return { accessToken, refreshToken };
  }

  async refresh(userId: string, refreshToken: string) {
    // VALIDATION
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRt) {
      throw new ForbiddenException('Access denied');
    }

    // EXECUTION
    const { hashedRt } = user;
    const rtMatches = await argon2.verify(hashedRt, refreshToken);
    if (!rtMatches) {
      throw new ForbiddenException('Access denied');
    }

    // RETURN
    return this.signTokens(user.id.toString(), user.email);
  }
}
