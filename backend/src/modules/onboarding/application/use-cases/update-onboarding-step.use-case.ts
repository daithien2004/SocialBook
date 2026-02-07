import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IOnboardingRepository } from '../../domain/repositories/onboarding.repository.interface';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class UpdateOnboardingStepUseCase {
  constructor(
    @Inject(IOnboardingRepository)
    private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async execute(userId: string, step: number, data: any) {
    const onboarding = await this.onboardingRepository.findByUserId(userId);
    if (!onboarding) {
      throw new NotFoundException(ErrorMessages.ONBOARDING_NOT_FOUND);
    }

    onboarding.updateStep(step, data);
    return this.onboardingRepository.update(onboarding);
  }
}
