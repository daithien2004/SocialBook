import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { LoginHandler } from './commands/login/login.handler';
import { RegisterHandler } from './commands/register/register.handler';
import { OAuthAuthHandler } from './commands/oauth-auth/oauth-auth.handler';
import { RefreshTokenHandler } from './commands/refresh-token/refresh-token.handler';
import { LogoutHandler } from './commands/logout/logout.handler';
import { ForgotPasswordHandler } from './commands/forgot-password/forgot-password.handler';
import { ResetPasswordHandler } from './commands/reset-password/reset-password.handler';
import { VerifyOtpHandler } from './commands/verify-otp/verify-otp.handler';
import { ResendOtpHandler } from './commands/resend-otp/resend-otp.handler';
import { ValidateUserHandler } from './commands/validate-user/validate-user.handler';
import { GenerateWsTicketHandler } from './commands/generate-ws-ticket/generate-ws-ticket.handler';

import { TokenService } from './services/token.service';
import { OAuthStateService } from './services/oauth-state.service';
import { AuthCookieService } from './services/auth-cookie.service';

import { UsersApplicationModule } from '@/modules/users/application/users/users-application.module';
import {
  RolesApplicationModule,
  RolesInfrastructureModule,
} from '@/modules/roles';
import { OtpApplicationModule } from '@/modules/auth/application/otp/otp-application.module';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/repositories/users/users-repository.module';
import { OtpRepositoryModule } from '@/modules/auth/infrastructure/repositories/otp/otp-repository.module';
import { PasswordHasherModule } from '@/shared/infrastructure/password-hasher.module';
import { OAuthStateStorePort } from '@/modules/auth/application/auth/oauth-state-store.port';
import { RedisOAuthStateAdapter } from '@/modules/auth/infrastructure/auth/adapters/redis-oauth-state.adapter';

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
    RolesInfrastructureModule,
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
    GenerateWsTicketHandler,
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
    GenerateWsTicketHandler,
    TokenService,
    OAuthStateStorePort,
    OAuthStateService,
    AuthCookieService,
  ],
})
export class AuthApplicationModule {}
