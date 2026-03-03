import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersRepositoryModule } from '../database/repositories/users/users-repository.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersRepositoryModule,
  ],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthInfrastructureModule {}
