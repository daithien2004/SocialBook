import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersRepositoryModule } from '../database/repositories/users/users-repository.module';
import { RolesRepositoryModule } from '../database/repositories/roles/roles-repository.module';
import { AuthApplicationModule } from '@/application/auth/auth-application.module';
import { OAuthProviderStrategy } from '@/application/auth/services/oauth-provider.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleOAuthStrategy } from './services/google-oauth.strategy';
import { GitHubOAuthStrategy } from './services/github-oauth.strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersRepositoryModule,
    RolesRepositoryModule,
    AuthApplicationModule,
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
  ],
})
export class AuthInfrastructureModule {}
