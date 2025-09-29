import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from '@/src/modules/auth/passport/strategies/local.strategy';
import { JwtStrategy } from '@/src/modules/auth/passport/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '@/src/modules/auth/passport/strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule, PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global:true,
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
