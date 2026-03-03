import { Onboarding } from '../entities/onboarding.entity';

export interface IOnboardingRepository {
  findByUserId(userId: string): Promise<Onboarding | null>;
  create(onboarding: Onboarding): Promise<Onboarding>;
  update(onboarding: Onboarding): Promise<Onboarding>;
}

export const IOnboardingRepository = Symbol('IOnboardingRepository');
