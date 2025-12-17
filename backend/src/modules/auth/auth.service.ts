import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { OtpService } from '../otp/otp.service';
import { SignupGoogleDto, SignupLocalDto } from './dto/auth.dto';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) { }

  async login(user: any) {
    // VALIDATION
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account has not been verified');
    }

    // Populate role để lấy role name
    const userWithRole = await this.usersService.findById(user.id.toString());
    let roleName = 'user'; // default
    if (
      userWithRole?.roleId &&
      typeof userWithRole.roleId === 'object' &&
      'name' in userWithRole.roleId
    ) {
      roleName = (userWithRole.roleId as any).name || 'user';
    }

    // EXECUTION
    const tokens = await this.signTokens(
      user.id.toString(),
      user.email,
      roleName,
    );

    // RETURN
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        image: user.image,
        role: roleName,
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
      if (!user.isVerified) {
        // If user exists but is not verified, allow resending OTP
        // Optionally update user details here if needed
        return await this.sendOtp(dto.email);
      }
      throw new ConflictException('Email already exists');
    }

    // Fetch default 'user' role
    const userRole = await this.roleModel.findOne({ name: 'user' });
    if (!userRole) {
      throw new InternalServerErrorException('Default user role not found');
    }

    // EXECUTION
    await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      provider: 'local',
      roleId: userRole._id,
    });

    // RETURN
    return await this.sendOtp(dto.email);
  }

  // Endpoint xử lý cả login VÀ signup
  async googleAuth(dto: SignupGoogleDto) {
    // VALIDATION
    let user = await this.usersService.findByEmail(dto.email);

    // EXECUTION
    if (!user) {
      const userRole = await this.roleModel.findOne({ name: 'user' });
      console.log(userRole);
      if (!userRole) {
        throw new InternalServerErrorException('Default user role not found');
      }

      // Chưa có account → TỰ ĐỘNG TẠO MỚI
      user = await this.usersService.create({
        username: dto.username || dto.email.split('@')[0],
        email: dto.email,
        provider: 'google',
        providerId: dto.googleId,
        image: dto.image,
        isVerified: true,
        roleId: userRole._id,
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

    // Populate role để lấy role name
    const userWithRole = await this.usersService.findById(user.id.toString());
    let roleName = 'user'; // default
    if (
      userWithRole?.roleId &&
      typeof userWithRole.roleId === 'object' &&
      'name' in userWithRole.roleId
    ) {
      roleName = (userWithRole.roleId as any).name || 'user';
    }

    // EXECUTION
    const tokens = await this.signTokens(
      user.id.toString(),
      user.email,
      roleName,
    );
    // RESPONSE
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        image: user.image,
        role: roleName,
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

    if (!existingUser.password) {
      throw new BadRequestException(
        'Tài khoản này đăng nhập bằng bên thứ ba nên không thể đổi mật khẩu'
      );
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
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // EXECUTION
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    // RETURN
    return 'Password reset successful';
  }

  async validateUser(email: string, password: string) {
    // VALIDATION
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new UnauthorizedException(
        'Invalid email. Please check and try again.',
      );

    // EXECUTION
    const pwMatches = await bcrypt.compare(password, user.password!);
    if (!pwMatches)
      throw new UnauthorizedException(
        'Invalid password. Please check and try again.',
      );

    // RETURN
    return user;
  }

  async sendOtp(email: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email not found in system');
    }

    // Nếu user chưa active, cho phép gửi OTP
    if (!user.isVerified) {
      const otp = await this.otpService.generateOTP(email);
      return otp;
    }

    throw new BadRequestException('Account already activated');
  }

  async resendOtp(email: string): Promise<{ remainingTime: number }> {
    // Kiểm tra TTL của OTP hiện tại
    const ttl = await this.otpService.getOtpTTL(email);

    // Nếu không có OTP nào tồn tại
    if (ttl === -2) {
      throw new BadRequestException(
        'No previous OTP request found. Please request a new OTP.',
      );
    }

    // Chỉ cho phép resend nếu OTP cũ còn ít hơn 4 phút (240s)
    // Tránh spam khi vừa mới gửi OTP
    const RESEND_COOLDOWN = 60; // 1 phút
    if (ttl > 300 - RESEND_COOLDOWN) {
      const waitTime = ttl - (300 - RESEND_COOLDOWN);
      throw new BadRequestException(
        `Please wait ${waitTime} seconds before resending OTP`,
      );
    }

    // Gửi OTP mới
    await this.otpService.generateOTP(email);

    return {
      remainingTime: 300, // OTP mới có hiệu lực 5 phút
    };
  }

  async signTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

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

    const hashedRt = await bcrypt.hash(refreshToken, 10);
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
    const rtMatches = await bcrypt.compare(refreshToken, user.hashedRt);
    if (!rtMatches) {
      throw new ForbiddenException('Access denied');
    }

    // RETURN
    let roleName = 'user';
    if (
      user.roleId &&
      typeof user.roleId === 'object' &&
      'name' in (user.roleId as any)
    ) {
      roleName = ((user.roleId as any).name as string) || 'user';
    }
    return this.signTokens(user._id.toString(), user.email, roleName);
  }

  async validateRefreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Kiểm tra token có trong DB không (nếu dùng token rotation)
      const isValid = await this.usersService.checkRefreshTokenInDB(
        payload.sub,
        token,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
