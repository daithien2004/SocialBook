import { Module } from '@nestjs/common';
import { AuthApplicationModule } from './application/auth/auth-application.module';
import { AuthController } from './presentation/auth/auth.controller';
import { OAuthController } from './presentation/auth/oauth.controller';
import { AuthInfrastructureModule } from './infrastructure/auth/auth-infrastructure.module';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/public-api';

@Module({
  imports: [
    AuthApplicationModule,
    AuthInfrastructureModule,
    UsersRepositoryModule,
  ],
  controllers: [AuthController, OAuthController],
})
export class AuthModule {}
