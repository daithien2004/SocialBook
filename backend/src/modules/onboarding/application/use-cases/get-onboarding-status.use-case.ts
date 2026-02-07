import { Injectable, Inject } from '@nestjs/common';
import { IOnboardingRepository } from '../../domain/repositories/onboarding.repository.interface';

@Injectable()
export class GetOnboardingStatusUseCase {
  constructor(
    @Inject(IOnboardingRepository)
    private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async execute(userId: string) {
    const onboarding = await this.onboardingRepository.findByUserId(userId);
    if (!onboarding) {
      return { isCompleted: false, currentStep: 1 };
    }
    return {
      isCompleted: onboarding.isCompleted,
      currentStep: onboarding.currentStep,
    };
  }
}
