import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { LoginHandler } from './use-cases/login/login.handler';
import { RegisterHandler } from './use-cases/register/register.handler';
import { OAuthAuthHandler } from './use-cases/oauth-auth/oauth-auth.handler';
import { RefreshTokenHandler } from './use-cases/refresh-token/refresh-token.handler';
import { LogoutHandler } from './use-cases/logout/logout.handler';
import { ForgotPasswordHandler } from './use-cases/forgot-password/forgot-password.handler';
import { ResetPasswordHandler } from './use-cases/reset-password/reset-password.handler';
import { VerifyOtpHandler } from './use-cases/verify-otp/verify-otp.handler';
import { ResendOtpHandler } from './use-cases/resend-otp/resend-otp.handler';
import { ValidateUserHandler } from './use-cases/validate-user/validate-user.handler';

import { TokenService } from './services/token.service';
import { OAuthStateService } from './services/oauth-state.service';
import { AuthCookieService } from './services/auth-cookie.service';

import { UsersApplicationModule } from '../users/users-application.module';
import { RolesApplicationModule } from '../roles/roles-application.module';
import { OtpApplicationModule } from '../otp/otp-application.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { RolesRepositoryModule } from '@/infrastructure/database/repositories/roles/roles-repository.module';
import { OtpRepositoryModule } from '@/infrastructure/database/repositories/otp/otp-repository.module';
import { PasswordHasherModule } from '@/shared/infrastructure/password-hasher.module';
import { OAuthStateStorePort } from '@/application/ports/oauth-state-store.port';
import { RedisOAuthStateAdapter } from '@/infrastructure/auth/adapters/redis-oauth-state.adapter';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('env.JWT_ACCESS_SECRET'),
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
    PasswordHasherModule,
  ],
  providers: [
    TokenService,
    LoginHandler,
    RegisterHandler,
    OAuthAuthHandler,
    RefreshTokenHandler,
    LogoutHandler,
    ForgotPasswordHandler,
    ResetPasswordHandler,
    VerifyOtpHandler,
    ResendOtpHandler,
    ValidateUserHandler,
    RedisOAuthStateAdapter,
    {
      provide: OAuthStateStorePort,
      useExisting: RedisOAuthStateAdapter,
    },
    OAuthStateService,
    AuthCookieService,
  ],

  exports: [
    LoginHandler,
    RegisterHandler,
    OAuthAuthHandler,
    RefreshTokenHandler,
    LogoutHandler,
    ForgotPasswordHandler,
    ResetPasswordHandler,
    VerifyOtpHandler,
    ResendOtpHandler,
    ValidateUserHandler,
    TokenService,
    OAuthStateStorePort,
    OAuthStateService,
    AuthCookieService,
  ],
})
export class AuthApplicationModule {}
