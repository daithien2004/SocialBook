import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/public-api';
import { RolesInfrastructureModule } from '@/modules/roles/infrastructure/public-api';
import { AuthApplicationModule } from '@/modules/auth/application/auth/auth-application.module';
import { OAuthProviderStrategy } from '@/modules/auth/application/auth/services/oauth-provider.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleOAuthStrategy } from './services/google-oauth.strategy';
import { GitHubOAuthStrategy } from './services/github-oauth.strategy';
import { TokenRotationModule } from '../cache/token-rotation.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersRepositoryModule,
    RolesInfrastructureModule,
    AuthApplicationModule,
    TokenRotationModule,
  ],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    GoogleOAuthStrategy,
    GitHubOAuthStrategy,
    {
      provide: OAuthProviderStrategy,
      useFactory: (
        google: GoogleOAuthStrategy,
        github: GitHubOAuthStrategy,
      ) => [google, github],
      inject: [GoogleOAuthStrategy, GitHubOAuthStrategy],
    },
  ],
  exports: [
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    GoogleOAuthStrategy,
    GitHubOAuthStrategy,
    OAuthProviderStrategy,
    TokenRotationModule,
  ],
})
export class AuthInfrastructureModule {}
