import { Module } from '@nestjs/common';
import { AuthApplicationModule } from './application/auth/auth-application.module';
import { AuthController } from './presentation/auth/auth.controller';
import { OAuthController } from './presentation/auth/oauth.controller';
import { AuthInfrastructureModule } from './infrastructure/auth/auth-infrastructure.module';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/public-api';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineUserAbilities } from '@/modules/users/application/public-api';
import { AuthActorContextGuard } from './presentation/auth/guards/auth-actor-context.guard';

@Module({
  imports: [
    AuthApplicationModule,
    AuthInfrastructureModule,
    UsersRepositoryModule,
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineUserAbilities]),
    },
    AuthActorContextGuard,
    PoliciesGuard,
  ],
})
export class AuthModule {}
