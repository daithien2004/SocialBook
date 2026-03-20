import { Injectable, Inject } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IOnboardingRepository } from '@/domain/onboarding/repositories/onboarding.repository.interface';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class UpdateOnboardingStepUseCase {
  constructor(
    @Inject(IOnboardingRepository)
    private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async execute(userId: string, step: number, data: any) {
    const onboarding = await this.onboardingRepository.findByUserId(userId);
    if (!onboarding) {
      throw new NotFoundDomainException(ErrorMessages.ONBOARDING_NOT_FOUND);
    }

    onboarding.updateStep(step, data);
    return this.onboardingRepository.update(onboarding);
  }
}

