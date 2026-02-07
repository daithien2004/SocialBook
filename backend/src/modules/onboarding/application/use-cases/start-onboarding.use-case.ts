import { Injectable, Inject } from '@nestjs/common';
import { IOnboardingRepository } from '../../domain/repositories/onboarding.repository.interface';
import { Onboarding } from '../../domain/entities/onboarding.entity';
import { IUserRepository } from '@/src/modules/users/domain/repositories/user.repository.interface';
import { UserId } from '@/src/modules/users/domain/value-objects/user-id.vo';

@Injectable()
export class StartOnboardingUseCase {
  constructor(
    @Inject(IOnboardingRepository)
    private readonly onboardingRepository: IOnboardingRepository,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string) {
    const existing = await this.onboardingRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const newOnboarding = Onboarding.create(userId);
    const savedOnboarding = await this.onboardingRepository.create(newOnboarding);
    
    // Update User with onboardingId
    await this.userRepository.updateOnboardingData(UserId.create(userId), {
        onboardingId: savedOnboarding.id
    });

    return savedOnboarding;
  }
}
