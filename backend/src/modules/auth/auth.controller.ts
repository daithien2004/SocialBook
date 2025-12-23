import type { Response } from 'express';
import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UseGuards,
  Request,
  Get,
  HttpStatus,
  HttpCode,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  SignupLocalDto,
} from './dto/auth.dto';
import { LocalAuthGuard } from '@/src/common/guards/local-auth.guard';
import { JwtRefreshAuthGuard } from '@/src/common/guards/jwt-refresh-auth.guard';
import { Public } from '@/src/common/decorators/customize';
import { LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('google/login')
  async handleGoogleLogin(
    @Body()
    data: {
      username: string;
      email: string;
      googleId: string;
      image: string;
    },
  ) {
    return this.authService.googleAuth(data);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any, @Body() dto: LoginDto) {
    const result = await this.authService.login(req.user);

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
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupLocalDto) {
    const otp = await this.authService.signup(dto);

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
      data: {
        otp: otp,
      },
    };
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    try {
      const result = await this.authService.verifyOtpAndActivate(
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
  async resendOtp(@Body('email') email: string) {
    try {
      const result = await this.authService.resendOtp(email);
      return {
        message: 'Gửi lại mã OTP thành công',
        data: {
          remainingTime: result.remainingTime,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException(
        'Vui lòng cung cấp Refresh token',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const payload = await this.authService.validateRefreshToken(refreshToken);

      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refresh(payload.sub, refreshToken);

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
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn',
    };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    return { message: result };
  }
}
