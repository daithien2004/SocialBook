import { CommandBus } from '@nestjs/cqrs';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { User } from '@/modules/users/domain/public-api';

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
import { LoginGuard } from './guards/login.guard';

// Use Cases
import { GenerateWsTicketCommand } from '@/modules/auth/application/auth/commands/generate-ws-ticket/generate-ws-ticket.command';
import { ForgotPasswordCommand } from '@/modules/auth/application/auth/commands/forgot-password/forgot-password.command';
import { LoginCommand } from '@/modules/auth/application/auth/commands/login/login.command';
import { LogoutCommand } from '@/modules/auth/application/auth/commands/logout/logout.command';
import { RefreshTokenCommand } from '@/modules/auth/application/auth/commands/refresh-token/refresh-token.command';
import { RegisterCommand } from '@/modules/auth/application/auth/commands/register/register.command';
import { ResendOtpCommand } from '@/modules/auth/application/auth/commands/resend-otp/resend-otp.command';
import { ResetPasswordCommand } from '@/modules/auth/application/auth/commands/reset-password/reset-password.command';
import { VerifyOtpCommand } from '@/modules/auth/application/otp/commands/verify-otp/verify-otp.command';

import type { JwtValidatedUser } from '@/shared/platform/interfaces/jwt-validated-user.interface';
import type { JwtPayload } from '@/modules/auth/infrastructure/auth/strategies/jwt.strategy';
import type { ApiResponse } from '@/shared/platform/interfaces/api-response.interface';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { UserId } from '@/modules/users/domain/public-api';
import { AuthCookieService } from '@/modules/auth/application/auth/services/auth-cookie.service';
import type { SetCookieSpec } from '@/modules/auth/application/auth/services/auth-cookie.service';
import {
  ForgotPasswordDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupLocalDto,
  VerifyOtpDto,
} from '@/modules/auth/presentation/auth/dto/auth.dto';
import {
  MeResponseDto,
  ProfileResponseDto,
} from '@/modules/auth/presentation/auth/dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,

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
  @UseGuards(LoginGuard)
  @Post('login')
  async login(
    @Req() req: { user: User; ip: string; headers: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const command = new LoginCommand(req.user, req.ip, userAgent);
    const result = await this.commandBus.execute(command);

    this.applyCookie(
      res,
      this.cookieService.refreshTokenCookie(result.refreshToken),
    );

    return {
      message: 'ÄÄƒng nháº­p thÃ nh cÃ´ng',
      data: { accessToken: result.accessToken },
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
    const result = await this.commandBus.execute(command);

    const refresh = this.cookieService.clearRefreshToken();
    const oauthState = this.cookieService.clearOauthState();
    res.clearCookie(refresh.name, { path: refresh.path });
    res.clearCookie(oauthState.name, { path: oauthState.path });

    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('ws-ticket')
  async getWsTicket(
    @Req() req: { user: JwtPayload },
  ): Promise<ApiResponse<{ ticket: string }>> {
    const command = new GenerateWsTicketCommand(req.user.sub, req.user.role);
    const ticket = await this.commandBus.execute(command);
    return { data: { ticket } };
  }

  @Public()
  @Throttle({ global: { limit: 5 } })
  @Post('signup')
  async signup(@Body() dto: SignupLocalDto) {
    const command = new RegisterCommand(dto.email, dto.username, dto.password);
    await this.commandBus.execute(command);

    return {
      message: 'MÃ£ OTP Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n email cá»§a báº¡n',
    };
  }

  @Public()
  @Throttle({ global: { limit: 5 } })
  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const command = new VerifyOtpCommand(body.email, body.otp);
    const result = await this.commandBus.execute(command);
    return { message: result };
  }

  @Public()
  @Throttle({ global: { limit: 3 } })
  @Post('resend-otp')
  async resendOtp(@Body() body: ResendOtpDto) {
    const command = new ResendOtpCommand(body.email);
    const result = await this.commandBus.execute(command);
    return {
      message: 'Gá»­i láº¡i mÃ£ OTP thÃ nh cÃ´ng',
      data: {
        resendCooldown: result.resendCooldown,
      },
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Public()
  @Throttle({ global: { limit: 10 } })
  @Post('refresh')
  async refresh(
    @Req()
    req: {
      user: JwtPayload;
      cookies?: Record<string, string>;
      ip: string;
      headers: Record<string, string>;
    },
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = body.refreshToken ?? req.cookies?.sb_refresh_token;
    if (!refreshToken) {
      throw new HttpException(
        'Vui lÃ²ng cung cáº¥p Refresh token',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userAgent = req.headers['user-agent'] || 'unknown';

    const command = new RefreshTokenCommand(
      req.user.sub,
      refreshToken,
      req.ip,
      userAgent,
    );
    const { accessToken, refreshToken: newRefreshToken } =
      await this.commandBus.execute(command);

    this.applyCookie(
      res,
      this.cookieService.refreshTokenCookie(newRefreshToken),
    );

    return {
      message: 'LÃ m má»›i token thÃ nh cÃ´ng',
      data: { accessToken },
    };
  }

  @Public()
  @Throttle({ global: { limit: 3 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const command = new ForgotPasswordCommand(dto.email);
    await this.commandBus.execute(command);
    return {
      message:
        'MÃ£ OTP Ä‘áº·t láº¡i máº­t kháº©u Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n email cá»§a báº¡n',
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
    const result = await this.commandBus.execute(command);
    return { message: result };
  }
}
