import { Module } from '@nestjs/common';
import { ContentModerationApplicationModule } from './application/content-moderation-application.module';
import { AdminToxicWordsController } from './presentation/admin-toxic-words.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineContentModerationAbilities } from './application/policies/content-moderation.ability';

@Module({
  imports: [ContentModerationApplicationModule],
  controllers: [AdminToxicWordsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineContentModerationAbilities]),
    },
    PoliciesGuard,
  ],
})
export class ContentModerationModule {}
