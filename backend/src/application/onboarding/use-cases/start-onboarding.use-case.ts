import { Injectable, Inject } from '@nestjs/common';
import { IOnboardingRepository } from '@/domain/onboarding/repositories/onboarding.repository.interface';
import { Onboarding } from '@/domain/onboarding/entities/onboarding.entity';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@Injectable()
export class StartOnboardingUseCase {
  constructor(
    @Inject(IOnboardingRepository)
    private readonly onboardingRepository: IOnboardingRepository,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(userId: string) {
    const existing = await this.onboardingRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const newOnboarding = Onboarding.create(this.idGenerator.generate(), userId);
    const savedOnboarding = await this.onboardingRepository.create(newOnboarding);
    
    // Update User with onboardingId
    await this.userRepository.updateOnboardingData(UserId.create(userId), {
        onboardingId: savedOnboarding.id
    });

    return savedOnboarding;
  }
}

