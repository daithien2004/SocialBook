import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  UseGuards,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const { accessToken } = await this.authService.login(user);
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      sameSite: 'lax', // adjust for production + HTTPS
      maxAge: 1000 * 60 * 60, // 1 hour
      // secure: true, // bật trên https
    });
    return { ok: true };
  }

  //   @UseGuards(JwtAuthGuard)
  //   @Get('me')
  //   me(@Req() req: Request) {
  //     return req.user;
  //   }
}
