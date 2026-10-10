import { CommandBus } from '@nestjs/cqrs';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { User } from '@/modules/users/domain/public-api';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';

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
  AccessTokenResponseDto,
  MeResponseDto,
  ProfileResponseDto,
  ResendOtpResponseDto,
  WsTicketResponseDto,
} from '@/modules/auth/presentation/auth/dto/auth-response.dto';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';

@ApiProblemResponses()
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
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccessTokenResponseDto })
  async login(
    @Req() req: { user: User; ip: string; headers: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const command = new LoginCommand(req.user, req.ip, userAgent);
    const result = await this.commandBus.execute(command);

    this.applyCookie(
      res,
      this.cookieService.refreshTokenCookie(result.refreshToken),
    );

    return { accessToken: result.accessToken };
  }

  @Get('profile')
  @ApiOkResponse({ type: ProfileResponseDto })
  getProfile(@Req() req: { user: JwtValidatedUser }): ProfileResponseDto {
    const { id, email, role } = req.user;
    return {
      id,
      email,
      role,
    };
  }

  @Get('me')
  @ApiOkResponse({ type: MeResponseDto })
  async getMe(@Req() req: { user: JwtValidatedUser }): Promise<MeResponseDto> {
    const user = await this.userRepository.findById(UserId.create(req.user.id));
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      username: user?.username ?? '',
      image: user?.image,
    };
  }

  @HttpCode(204)
  @Post('logout')
  @ApiNoContentResponse()
  async logout(
    @Req() req: { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const command = new LogoutCommand(req.user.id);
    await this.commandBus.execute(command);

    const refresh = this.cookieService.clearRefreshToken();
    const oauthState = this.cookieService.clearOauthState();
    res.clearCookie(refresh.name, { path: refresh.path });
    res.clearCookie(oauthState.name, { path: oauthState.path });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('ws-ticket')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WsTicketResponseDto })
  async getWsTicket(
    @Req() req: { user: JwtPayload },
  ): Promise<{ ticket: string }> {
    const command = new GenerateWsTicketCommand(req.user.sub, req.user.role);
    const ticket = await this.commandBus.execute(command);
    return { ticket };
  }

  @Public()
  @Throttle({ global: { limit: 5 } })
  @Post('signup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async signup(@Body() dto: SignupLocalDto) {
    const command = new RegisterCommand(dto.email, dto.username, dto.password);
    await this.commandBus.execute(command);

    return undefined;
  }

  @Public()
  @Throttle({ global: { limit: 5 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const command = new VerifyOtpCommand(body.email, body.otp);
    await this.commandBus.execute(command);
    return undefined;
  }

  @Public()
  @Throttle({ global: { limit: 3 } })
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ResendOtpResponseDto })
  async resendOtp(@Body() body: ResendOtpDto) {
    const command = new ResendOtpCommand(body.email);
    const result = await this.commandBus.execute(command);
    return {
      resendCooldown: result.resendCooldown,
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Public()
  @Throttle({ global: { limit: 10 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccessTokenResponseDto })
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
  ): Promise<{ accessToken: string }> {
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

    return { accessToken };
  }

  @Public()
  @Throttle({ global: { limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const command = new ForgotPasswordCommand(dto.email);
    await this.commandBus.execute(command);
    return undefined;
  }

  @Public()
  @Throttle({ global: { limit: 3 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const command = new ResetPasswordCommand(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    await this.commandBus.execute(command);
    return undefined;
  }
}
