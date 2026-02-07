import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './presentation/auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from '@/src/modules/auth/infrastructure/strategies/local.strategy';
import { JwtStrategy } from '@/src/modules/auth/infrastructure/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '@/src/modules/auth/infrastructure/strategies/jwt-refresh.strategy';
import { OtpModule } from '@/src/modules/otp/otp.module';

import { RolesModule } from '../roles/roles.module';

// Use Cases & Services
import { TokenService } from './application/services/token.service';
import { LoginUseCase } from './application/use-cases/login/login.use-case';
import { RegisterUseCase } from './application/use-cases/register/register.use-case';
import { GoogleAuthUseCase } from './application/use-cases/google-auth/google-auth.use-case';
import { ValidateUserUseCase } from './application/use-cases/validate-user/validate-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout/logout.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password/reset-password.use-case';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp/verify-otp.use-case';
import { ResendOtpUseCase } from './application/use-cases/resend-otp/resend-otp.use-case';


@Module({
  imports: [
    UsersModule,
    RolesModule,
    PassportModule,
    OtpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LocalStrategy, 
    JwtStrategy, 
    JwtRefreshStrategy,
    // New Providers
    TokenService,
    LoginUseCase,
    RegisterUseCase,
    GoogleAuthUseCase,
    ValidateUserUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyOtpUseCase,
    ResendOtpUseCase
  ],
  exports: [JwtModule],
})
export class AuthModule { }
