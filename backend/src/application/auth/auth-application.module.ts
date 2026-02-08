import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { LoginUseCase } from './use-cases/login/login.use-case';
import { RegisterUseCase } from './use-cases/register/register.use-case';
import { GoogleAuthUseCase } from './use-cases/google-auth/google-auth.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token/refresh-token.use-case';
import { LogoutUseCase } from './use-cases/logout/logout.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password/reset-password.use-case';
import { VerifyOtpUseCase } from './use-cases/verify-otp/verify-otp.use-case';
import { ResendOtpUseCase } from './use-cases/resend-otp/resend-otp.use-case';
import { ValidateUserUseCase } from './use-cases/validate-user/validate-user.use-case';

import { TokenService } from './services/token.service';

import { UsersApplicationModule } from '../users/users-application.module';
import { RolesApplicationModule } from '../roles/roles-application.module';
import { OtpApplicationModule } from '../otp/otp-application.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { RolesRepositoryModule } from '@/infrastructure/database/repositories/roles/roles-repository.module';
import { OtpRepositoryModule } from '@/infrastructure/database/repositories/otp/otp-repository.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRE'),
        },
      }),
    }),
    UsersApplicationModule,
    RolesApplicationModule,
    OtpApplicationModule,
    UsersRepositoryModule,
    RolesRepositoryModule,
    OtpRepositoryModule,
  ],
  providers: [
    TokenService,
    LoginUseCase,
    RegisterUseCase,
    GoogleAuthUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyOtpUseCase,
    ResendOtpUseCase,
    ValidateUserUseCase,
  ],
  exports: [
    LoginUseCase,
    RegisterUseCase,
    GoogleAuthUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyOtpUseCase,
    ResendOtpUseCase,
    ValidateUserUseCase,
    TokenService,
  ],
})
export class AuthApplicationModule {}
