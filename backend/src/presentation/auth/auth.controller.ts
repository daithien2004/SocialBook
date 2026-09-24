import { Public } from '@/common/decorators/custom.decorator';
import { User } from '@/domain/users/entities/user.entity';

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';

// Use Cases
import { ForgotPasswordCommand } from '@/application/auth/use-cases/forgot-password/forgot-password.command';
import { ForgotPasswordUseCase } from '@/application/auth/use-cases/forgot-password/forgot-password.use-case';
import { LoginCommand } from '@/application/auth/use-cases/login/login.command';
import { LoginUseCase } from '@/application/auth/use-cases/login/login.use-case';
import { LogoutCommand } from '@/application/auth/use-cases/logout/logout.command';
import { LogoutUseCase } from '@/application/auth/use-cases/logout/logout.use-case';
import { RefreshTokenCommand } from '@/application/auth/use-cases/refresh-token/refresh-token.command';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token/refresh-token.use-case';
import { RegisterCommand } from '@/application/auth/use-cases/register/register.command';
import { RegisterUseCase } from '@/application/auth/use-cases/register/register.use-case';
import { ResendOtpCommand } from '@/application/auth/use-cases/resend-otp/resend-otp.command';
import { ResendOtpUseCase } from '@/application/auth/use-cases/resend-otp/resend-otp.use-case';
import { ResetPasswordCommand } from '@/application/auth/use-cases/reset-password/reset-password.command';
import { ResetPasswordUseCase } from '@/application/auth/use-cases/reset-password/reset-password.use-case';
import { VerifyOtpCommand } from '@/application/auth/use-cases/verify-otp/verify-otp.command';
import { VerifyOtpUseCase } from '@/application/auth/use-cases/verify-otp/verify-otp.use-case';

import type { JwtValidatedUser } from '@/common/interfaces/jwt-validated-user.interface';
import type { JwtPayload } from '@/infrastructure/auth/strategies/jwt.strategy';
import type { ApiResponse } from '@/common/interfaces/api-response.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { AuthCookieService } from '@/application/auth/services/auth-cookie.service';
import type { SetCookieSpec } from '@/application/auth/services/auth-cookie.service';
import {
  ForgotPasswordDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupLocalDto,
  VerifyOtpDto,
} from '@/presentation/auth/dto/auth.dto';
import {
  LoginResponseDto,
  MeResponseDto,
  ProfileResponseDto,
  TokenPairDto,
} from '@/presentation/auth/dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly resendOtpUseCase: ResendOtpUseCase,
    private readonly userRepository: IUserRepository,
    private readonly cookieService: AuthCookieService,
  ) {}

  private applyCookie(res: Response, spec: SetCookieSpec): void {
    res.cookie(spec.name, spec.value, {
      path: spec.path,
      maxAge: spec.maxAgeSeconds * 1000,
      httpOnly: spec.httpOnly,
      secure: spec.secure,
      sameSite: spec.sameSite,
    });
  }

  @Public()
  @Throttle({ global: { limit: 5 } })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Req() req: { user: User },
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const command = new LoginCommand(req.user);
    const result = await this.loginUseCase.execute(command);

    this.applyCookie(
      res,
      this.cookieService.accessTokenCookie(result.accessToken),
    );
    this.applyCookie(
      res,
      this.cookieService.refreshTokenCookie(result.refreshToken),
    );

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
  getProfile(
    @Req() req: { user: JwtValidatedUser },
  ): ApiResponse<ProfileResponseDto> {
    const { id, email, role } = req.user;
    return {
      data: {
        id,
        email,
        role,
      },
    };
  }

  @Get('me')
  async getMe(
    @Req() req: { user: JwtValidatedUser },
  ): Promise<ApiResponse<MeResponseDto>> {
    const user = await this.userRepository.findById(UserId.create(req.user.id));
    return {
      data: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        username: user?.username ?? '',
        image: user?.image,
      },
    };
  }

  @Post('logout')
  async logout(
    @Req() req: { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    const command = new LogoutCommand(req.user.id);
    const result = await this.logoutUseCase.execute(command);

    const access = this.cookieService.clearAccessToken();
    const refresh = this.cookieService.clearRefreshToken();
    const oauthState = this.cookieService.clearOauthState();
    res.clearCookie(access.name, { path: access.path });
    res.clearCookie(refresh.name, { path: refresh.path });
    res.clearCookie(oauthState.name, { path: oauthState.path });

    return result;
  }

  @Public()
  @Throttle({ global: { limit: 5 } })
  @Post('signup')
  async signup(@Body() dto: SignupLocalDto) {
    const command = new RegisterCommand(dto.email, dto.username, dto.password);
    await this.registerUseCase.execute(command);

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  }

  @Public()
  @Throttle({ global: { limit: 5 } })
  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const command = new VerifyOtpCommand(body.email, body.otp);
    const result = await this.verifyOtpUseCase.execute(command);
    return { message: result };
  }

  @Public()
  @Throttle({ global: { limit: 3 } })
  @Post('resend-otp')
  async resendOtp(@Body() body: ResendOtpDto) {
    const command = new ResendOtpCommand(body.email);
    const result = await this.resendOtpUseCase.execute(command);
    return {
      message: 'Gửi lại mã OTP thành công',
      data: {
        resendCooldown: result.resendCooldown,
      },
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Public()
  @Post('refresh')
  async refresh(
    @Req()
    req: { user: JwtPayload; cookies?: Record<string, string> },
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<TokenPairDto>> {
    const refreshToken = body.refreshToken ?? req.cookies?.sb_refresh_token;
    if (!refreshToken) {
      throw new HttpException(
        'Vui lòng cung cấp Refresh token',
        HttpStatus.BAD_REQUEST,
      );
    }

    const command = new RefreshTokenCommand(req.user.sub, refreshToken);
    const { accessToken, refreshToken: newRefreshToken } =
      await this.refreshTokenUseCase.execute(command);

    this.applyCookie(res, this.cookieService.accessTokenCookie(accessToken));
    this.applyCookie(
      res,
      this.cookieService.refreshTokenCookie(newRefreshToken),
    );

    return {
      message: 'Làm mới token thành công',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  @Public()
  @Throttle({ global: { limit: 3 } })
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
    const command = new ResetPasswordCommand(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    const result = await this.resetPasswordUseCase.execute(command);
    return { message: result };
  }
}
