import { Public } from '@/src/common/decorators/customize';
import { JwtRefreshAuthGuard } from '@/src/common/guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from '@/src/common/guards/local-auth.guard';
import { User } from '../../users/domain/entities/user.entity';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Use Cases
import { LoginUseCase } from '../application/use-cases/login/login.use-case';
import { RegisterUseCase } from '../application/use-cases/register/register.use-case';
import { GoogleAuthUseCase } from '../application/use-cases/google-auth/google-auth.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout/logout.use-case';
import { ForgotPasswordUseCase } from '../application/use-cases/forgot-password/forgot-password.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password/reset-password.use-case';
import { VerifyOtpUseCase } from '../application/use-cases/verify-otp/verify-otp.use-case';
import { ResendOtpUseCase } from '../application/use-cases/resend-otp/resend-otp.use-case';

import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupGoogleDto,
  SignupLocalDto,
  VerifyOtpDto,
} from '../application/dto/auth.dto';

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
  @ApiOperation({ summary: 'Login with Google' })
  @ApiBody({ type: SignupGoogleDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @Post('google/login')
  async handleGoogleLogin(@Body() data: SignupGoogleDto) {
    const result = await this.googleAuthUseCase.execute(data);
    return {
      data: result
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: { user: User }, @Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(req.user);

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
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req: { user: User }) {
    return req.user;
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  async logout(@Req() req: { user: { id: string } }) {
      return await this.logoutUseCase.execute(req.user.id);
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'OTP sent to email' })
  async signup(@Body() dto: SignupLocalDto) {
    const otp = await this.registerUseCase.execute(dto);

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and activate account' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'Account activated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or email' })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    try {
      const result = await this.verifyOtpUseCase.execute(
        body.email,
        body.otp,
      );
      return { message: result };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Public()
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiBody({ type: ResendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  async resendOtp(@Body() body: ResendOtpDto) {
    try {
      const result = await this.resendOtpUseCase.execute(body.email);
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
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Result token invalid' })
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

      const { accessToken, refreshToken: newRefreshToken } =
        await this.refreshTokenUseCase.execute(payload.sub, refreshToken);

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
  @ApiOperation({ summary: 'Request password reset via email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.forgotPasswordUseCase.execute(dto.email);
    return {
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn',
    };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.resetPasswordUseCase.execute(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    return { message: result };
  }
}
