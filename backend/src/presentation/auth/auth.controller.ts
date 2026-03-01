import { Public } from '@/common/decorators/customize';
import { JwtRefreshAuthGuard } from '@/common/guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from '@/common/guards/local-auth.guard';
import { User } from '@/domain/users/entities/user.entity';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

// Use Cases
import { LoginUseCase } from '@/application/auth/use-cases/login/login.use-case';
import { LoginCommand } from '@/application/auth/use-cases/login/login.command';
import { RegisterUseCase } from '@/application/auth/use-cases/register/register.use-case';
import { RegisterCommand } from '@/application/auth/use-cases/register/register.command';
import { GoogleAuthUseCase } from '@/application/auth/use-cases/google-auth/google-auth.use-case';
import { GoogleAuthCommand } from '@/application/auth/use-cases/google-auth/google-auth.command';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token/refresh-token.use-case';
import { RefreshTokenCommand } from '@/application/auth/use-cases/refresh-token/refresh-token.command';
import { LogoutUseCase } from '@/application/auth/use-cases/logout/logout.use-case';
import { LogoutCommand } from '@/application/auth/use-cases/logout/logout.command';
import { ForgotPasswordUseCase } from '@/application/auth/use-cases/forgot-password/forgot-password.use-case';
import { ForgotPasswordCommand } from '@/application/auth/use-cases/forgot-password/forgot-password.command';
import { ResetPasswordUseCase } from '@/application/auth/use-cases/reset-password/reset-password.use-case';
import { ResetPasswordCommand } from '@/application/auth/use-cases/reset-password/reset-password.command';
import { VerifyOtpUseCase } from '@/application/auth/use-cases/verify-otp/verify-otp.use-case';
import { VerifyOtpCommand } from '@/application/auth/use-cases/verify-otp/verify-otp.command';
import { ResendOtpUseCase } from '@/application/auth/use-cases/resend-otp/resend-otp.use-case';
import { ResendOtpCommand } from '@/application/auth/use-cases/resend-otp/resend-otp.command';

import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupGoogleDto,
  SignupLocalDto,
  VerifyOtpDto,
} from '@/presentation/auth/dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly resendOtpUseCase: ResendOtpUseCase,
  ) { }

  @Public()
  @Post('google/login')
  async handleGoogleLogin(@Body() data: SignupGoogleDto) {
    const command = new GoogleAuthCommand(
      data.email,
      data.googleId,
      data.name,
      data.image,
      data.name
    );
    const result = await this.googleAuthUseCase.execute(command);
    return {
      data: result
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: { user: User }, @Body() dto: LoginDto) {
    const command = new LoginCommand(req.user);
    const result = await this.loginUseCase.execute(command);

    return {
      message: 'Đăng nhập thành công',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    };
  }

  @Get('profile')
  @ApiBearerAuth()
  getProfile(@Req() req: { user: User }) {
    return req.user;
  }

  @Post('logout')
  async logout(@Req() req: { user: { id: string } }) {
    const command = new LogoutCommand(req.user.id);
    return await this.logoutUseCase.execute(command);
  }

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupLocalDto) {
    const command = new RegisterCommand(dto.username, dto.email, dto.password);
    const otp = await this.registerUseCase.execute(command);

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    try {
      const command = new VerifyOtpCommand(body.email, body.otp);
      const result = await this.verifyOtpUseCase.execute(command);
      return { message: result };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Public()
  @Post('resend-otp')
  async resendOtp(@Body() body: ResendOtpDto) {
    try {
      const command = new ResendOtpCommand(body.email);
      const result = await this.resendOtpUseCase.execute(command);
      return {
        message: 'Gửi lại mã OTP thành công',
        data: {
          resendCooldown: result.resendCooldown,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Public()
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    const { refreshToken } = body;
    if (!refreshToken) {
      throw new HttpException(
        'Vui lòng cung cấp Refresh token',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const payload = await this.refreshTokenUseCase.validateRefreshToken(refreshToken);

      const command = new RefreshTokenCommand(payload.sub, refreshToken);
      const { accessToken, refreshToken: newRefreshToken } =
        await this.refreshTokenUseCase.execute(command);

      return {
        message: 'Làm mới token thành công',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      throw new HttpException('Refresh token không hợp lệ', HttpStatus.UNAUTHORIZED);
    }
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const command = new ForgotPasswordCommand(dto.email);
    await this.forgotPasswordUseCase.execute(command);
    return {
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn',
    };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const command = new ResetPasswordCommand(dto.email, dto.otp, dto.newPassword);
    const result = await this.resetPasswordUseCase.execute(command);
    return { message: result };
  }
}
