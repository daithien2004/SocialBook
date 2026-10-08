import { Module } from '@nestjs/common';
import { AuthApplicationModule } from './application/auth/auth-application.module';
import { AuthController } from './presentation/auth/auth.controller';
import { OAuthController } from './presentation/auth/oauth.controller';
import { AuthInfrastructureModule } from './infrastructure/auth/auth-infrastructure.module';

@Module({
  imports: [AuthApplicationModule, AuthInfrastructureModule],
  controllers: [AuthController, OAuthController],
})
export class AuthModule {}
