import { Module } from '@nestjs/common';
import { UserHighlightsApplicationModule } from './application/user-highlights-application.module';
import { UserHighlightsController } from './presentation/user-highlights.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineUserHighlightAbilities } from './application/policies/user-highlight.ability';

@Module({
  imports: [UserHighlightsApplicationModule],
  controllers: [UserHighlightsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineUserHighlightAbilities]),
    },
    PoliciesGuard,
  ],
})
export class UserHighlightsModule {}
