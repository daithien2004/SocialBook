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
  constructor(private authService: AuthService) {}

  @Public()
  @Post('google/callback')
  async handleGoogleCallback(
    @Body()
    data: {
      username: string;
      email: string;
      googleId: string;
      avatar: string;
    },
  ) {
    return this.authService.googleAuth(data);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: any,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(req.user);

    // Set refresh token in HTTP-only cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Response sẽ được transform bởi TransformInterceptor
    return {
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
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
      message: 'OTP sent to email',
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

  @UseGuards(JwtRefreshAuthGuard)
  @Public()
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];

    const { accessToken, refreshToken: newRt } = await this.authService.refresh(
      userId,
      refreshToken,
    );

    res.cookie('refresh_token', newRt, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Refresh successful',
      data: { accessToken },
    };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'OTP sent to your email for password reset',
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
