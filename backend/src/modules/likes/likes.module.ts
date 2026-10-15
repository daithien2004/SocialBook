import { Module } from '@nestjs/common';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { LikesApplicationModule } from './application/likes-application.module';
import { LikesController } from './presentation/likes.controller';
import { defineLikeAbilities } from './application/policies/like.ability';

@Module({
  imports: [LikesApplicationModule],
  controllers: [LikesController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineLikeAbilities]),
    },
    PoliciesGuard,
  ],
})
export class LikesModule {}
