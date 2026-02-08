import { Module } from '@nestjs/common';
import { CompleteOnboardingUseCase } from './use-cases/complete-onboarding.use-case';
import { GetOnboardingStatusUseCase } from './use-cases/get-onboarding-status.use-case';
import { StartOnboardingUseCase } from './use-cases/start-onboarding.use-case';
import { UpdateOnboardingStepUseCase } from './use-cases/update-onboarding-step.use-case';
import { OnboardingRepositoryModule } from '@/infrastructure/database/repositories/onboarding/onboarding-repository.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { GamificationRepositoryModule } from '@/infrastructure/database/repositories/gamification/gamification-repository.module';
import { GamificationApplicationModule } from '../gamification/gamification-application.module';

@Module({
  imports: [
    OnboardingRepositoryModule,
    UsersRepositoryModule,
    GamificationRepositoryModule,
    GamificationApplicationModule,
  ],
  providers: [
    CompleteOnboardingUseCase,
    GetOnboardingStatusUseCase,
    StartOnboardingUseCase,
    UpdateOnboardingStepUseCase,
  ],
  exports: [
    CompleteOnboardingUseCase,
    GetOnboardingStatusUseCase,
    StartOnboardingUseCase,
    UpdateOnboardingStepUseCase,
  ],
})
export class OnboardingApplicationModule {}
