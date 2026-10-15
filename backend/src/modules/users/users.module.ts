import { Module } from '@nestjs/common';
import { UsersApplicationModule } from './application/users/users-application.module';
import { UsersController } from './presentation/users/users.controller';
import { UserRoleChangeOutboxRelay } from './application/users/user-role-change-outbox-relay';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { UsersRepositoryModule } from './infrastructure/repositories/users/users-repository.module';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineUserAbilities } from './application/policies/user.ability';

@Module({
  imports: [UsersApplicationModule, UsersRepositoryModule],
  controllers: [UsersController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineUserAbilities]),
    },
    PoliciesGuard,
    ...(isWorkerProcess() ? [UserRoleChangeOutboxRelay] : []),
  ],
})
export class UsersModule {}
