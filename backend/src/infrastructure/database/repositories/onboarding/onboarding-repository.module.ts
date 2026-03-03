import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserOnboarding, UserOnboardingSchema } from '@/infrastructure/database/schemas/user-onboarding.schema';
import { IOnboardingRepository } from '@/domain/onboarding/repositories/onboarding.repository.interface';
import { OnboardingRepository } from './onboarding.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserOnboarding.name, schema: UserOnboardingSchema }]),
  ],
  providers: [
    {
      provide: IOnboardingRepository,
      useClass: OnboardingRepository,
    },
  ],
  exports: [
    MongooseModule,
    IOnboardingRepository,
  ],
})
export class OnboardingRepositoryModule {}
