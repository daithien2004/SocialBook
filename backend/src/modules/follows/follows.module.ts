import { Module } from '@nestjs/common';
import { FollowsApplicationModule } from './application/follows-application.module';
import { FollowsController } from './presentation/follows.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineFollowAbilities } from './application/policies/follow.ability';

@Module({
  imports: [FollowsApplicationModule],
  controllers: [FollowsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineFollowAbilities]),
    },
    PoliciesGuard,
  ],
})
export class FollowsModule {}
