import type { Response } from 'express';
import { Body, Controller, Post, Res, Req, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LocalAuthGuard } from '@/src/modules/auth/passport/guards/local-auth.guard';
import { JwtRefreshAuthGuard } from '@/src/modules/auth/passport/guards/jwt-refresh-auth.guard';
import { Public } from '@/src/modules/auth/decorator/customize';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req,
    @Res({ passthrough: true }) res: Response
    ) {
    // @ts-ignore
    const { accessToken, refreshToken } =  await this.authService.login(req.user);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.signup(
      dto.email,
      dto.password,
    );

    return { accessToken };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Public()
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
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

    return { accessToken };
  }
}
