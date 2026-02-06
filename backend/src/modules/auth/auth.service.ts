import { Logger } from '@/src/shared/logger';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OtpService } from '../otp/otp.service';
import { RolesRepository } from '../roles/roles.repository';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { SignupGoogleDto, SignupLocalDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private readonly rolesRepository: RolesRepository,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async login(user: User) {
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Tài khoản chưa được xác thực');
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        error: 'USER_BANNED',
      });
    }

    const userWithRole = await this.usersService.findById(user.id.toString());
    let roleName = 'user';
    if (
      userWithRole?.roleId &&
      typeof userWithRole.roleId === 'object' &&
      'name' in userWithRole.roleId
    ) {
      roleName = (userWithRole.roleId as any).name || 'user';
    }

    const tokens = await this.signTokens(
      user.id.toString(),
      user.email,
      roleName,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        image: user.image,
        role: roleName,
        onboardingCompleted: user.onboardingCompleted,
        onboardingId: user.onboardingId,
      },
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, { hashedRt: null });
    return { message: 'Đăng xuất thành công' };
  }

  async signup(dto: SignupLocalDto): Promise<string> {
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      if (!user.isVerified) {
        // Cập nhật lại thông tin user (username, password)
        await this.usersService.updateUnverifiedUser(user.id.toString(), {
          username: dto.username,
          password: dto.password,
        });
        
        return await this.sendOtp(dto.email);
      }
      throw new ConflictException('Email này đã được sử dụng');
    }

    const userRole = await this.rolesRepository.findByName('user');
    if (!userRole) {
      this.logger.error('User role not found in database during signup - role may not be seeded');
      throw new InternalServerErrorException('Đã có lỗi xảy ra trong quá trình đăng ký');
    }

    await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      provider: 'local',
      roleId: userRole._id,
    });

    return await this.sendOtp(dto.email);
  }

  async googleAuth(dto: SignupGoogleDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    // Handle new user registration
    if (!existingUser) {
      const userRole = await this.rolesRepository.findByName('user');
      if (!userRole) {
        this.logger.error('User role not found in database during Google signup - role may not be seeded');
        throw new InternalServerErrorException('Đã có lỗi xảy ra trong quá trình đăng ký');
      }

      const newUser = await this.usersService.create({
        username: dto.username || dto.name || dto.email.split('@')[0],
        email: dto.email,
        provider: 'google',
        providerId: dto.googleId,
        image: dto.image,
        isVerified: true,
        roleId: userRole._id,
      });

      const tokens = await this.signTokens(
        newUser.id,
        newUser.email,
        'user',
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          image: newUser.image,
          role: 'user',
          onboardingCompleted: newUser.onboardingCompleted,
          onboardingId: undefined,
        },
      };
    }

    // Handle existing user login
    if (!existingUser.isVerified) {
      throw new UnauthorizedException('Tài khoản chưa được xác thực');
    }

    if (existingUser.isBanned) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        error: 'USER_BANNED',
      });
    }

    if (existingUser.provider === 'local') {
      throw new ConflictException(
        'Email đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu hoặc liên kết tài khoản Google trước.',
      );
    }

    const userWithRole = await this.usersService.findById(existingUser.id.toString());
    let roleName = 'user';
    if (
      userWithRole?.roleId &&
      typeof userWithRole.roleId === 'object' &&
      'name' in userWithRole.roleId
    ) {
      roleName = (userWithRole.roleId as any).name || 'user';
    }

    const tokens = await this.signTokens(
      existingUser.id.toString(),
      existingUser.email,
      roleName,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: existingUser.id.toString(),
        email: existingUser.email,
        username: existingUser.username,
        image: existingUser.image,
        role: roleName,
        onboardingCompleted: existingUser.onboardingCompleted,
        onboardingId: existingUser.onboardingId,
      },
    };
  }

  async verifyOtpAndActivate(email: string, otp: string): Promise<string> {
    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    user.isVerified = true;
    await user.save();

    return 'Đăng ký thành công';
  }

  async forgotPassword(email: string): Promise<string> {
    const existingUser = await this.usersService.findByEmail(email);
    if (!existingUser) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    if (!existingUser.password) {
      throw new BadRequestException(
        'Tài khoản này đăng nhập bằng bên thứ ba nên không thể đổi mật khẩu'
      );
    }
    return this.otpService.generateOTP(email);
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<string> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới phải khác mật khẩu hiện tại',
      );
    }

    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    return 'Đặt lại mật khẩu thành công';
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new UnauthorizedException(
        'Email không hợp lệ. Vui lòng kiểm tra và thử lại.',
      );

    const pwMatches = await bcrypt.compare(password, user.password!);
    if (!pwMatches) {
      throw new UnauthorizedException(
        'Mật khẩu không đúng. Vui lòng kiểm tra và thử lại.',
      );
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        error: 'USER_BANNED',
      });
    }

    return user;
  }

  async sendOtp(email: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Không tìm thấy email trong hệ thống');
    }

    if (!user.isVerified) {
      await this.otpService.generateOTP(email);
      return 'Mã OTP đã được gửi đến email của bạn';
    }

    throw new BadRequestException('Tài khoản đã được kích hoạt');
  }

  async resendOtp(email: string): Promise<{ resendCooldown: number }> {
    const ttl = await this.otpService.getOtpTTL(email);

    if (ttl === -2) {
      throw new BadRequestException(
        'Không tìm thấy yêu cầu OTP trước đó. Vui lòng yêu cầu mã OTP mới.',
      );
    }

    const RESEND_COOLDOWN = 60;
    if (ttl > 300 - RESEND_COOLDOWN) {
      const waitTime = ttl - (300 - RESEND_COOLDOWN);
      throw new BadRequestException(
        `Vui lòng đợi ${waitTime} giây trước khi gửi lại OTP`,
      );
    }

    await this.otpService.generateOTP(email);

    return {
      resendCooldown: RESEND_COOLDOWN,
    };
  }

  async signTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessSecret = this.configService.get<string>('env.JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('env.JWT_REFRESH_SECRET');

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
    await this.usersService.updateRefreshToken(userId, { hashedRt });

    return { accessToken, refreshToken };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findForRefreshToken(userId);
    if (!user || !user.hashedRt) {
      throw new ForbiddenException('Từ chối truy cập');
    }
    const rtMatches = await bcrypt.compare(refreshToken, user.hashedRt);
    if (!rtMatches) {
      throw new ForbiddenException('Từ chối truy cập');
    }

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
        secret: this.configService.get<string>('env.JWT_REFRESH_SECRET'),
      });

      const isValid = await this.usersService.checkRefreshTokenInDB(
        payload.sub,
        token,
      );
      if (!isValid) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }
}
