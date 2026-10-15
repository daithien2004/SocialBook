import { Module } from '@nestjs/common';
import { AIApplicationModule } from './application/ai-application.module';
import { AIController } from './presentation/ai.controller';
import { AdminRateLimitController } from './presentation/admin-rate-limit.controller';
import { AIThrottleModule } from './presentation/ai-throttle.module';
import { RateLimitConfigModule } from './infrastructure/rate-limit/public-api';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineAiConfigurationAbilities } from './application/policies/ai-configuration.ability';
import { defineAIRequestAbilities } from './application/policies/ai-request.ability';

@Module({
  imports: [AIApplicationModule, AIThrottleModule, RateLimitConfigModule],
  controllers: [AIController, AdminRateLimitController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () =>
        new AbilityFactory([
          defineAiConfigurationAbilities,
          defineAIRequestAbilities,
        ]),
    },
    PoliciesGuard,
  ],
})
export class AIModule {}
