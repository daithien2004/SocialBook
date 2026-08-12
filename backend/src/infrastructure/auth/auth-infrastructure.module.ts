import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersRepositoryModule } from '../database/repositories/users/users-repository.module';
import { AuthApplicationModule } from '@/application/auth/auth-application.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersRepositoryModule,
    AuthApplicationModule,
  ],
  providers: [JwtStrategy, JwtRefreshStrategy, LocalStrategy],
  exports: [JwtStrategy, JwtRefreshStrategy, LocalStrategy],
})
export class AuthInfrastructureModule {}
