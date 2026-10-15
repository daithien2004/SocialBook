import { Module } from '@nestjs/common';
import { AnalyticsApplicationModule } from './application/analytics-application.module';
import { AnalyticsController } from './presentation/analytics.controller';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineAnalyticsAbilities } from './application/policies/analytics.ability';

@Module({
  imports: [AnalyticsApplicationModule],
  controllers: [AnalyticsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineAnalyticsAbilities]),
    },
    PoliciesGuard,
  ],
})
export class AnalyticsModule {}
