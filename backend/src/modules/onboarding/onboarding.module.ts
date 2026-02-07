import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingController } from './presentation/onboarding.controller';
import { User, UserSchema } from '../users/infrastructure/schemas/user.schema';
import { UserOnboarding, UserOnboardingSchema } from './infrastructure/schemas/user-onboarding.schema';
import { GamificationModule } from '../gamification/gamification.module';
import { UsersModule } from '../users/users.module';
import { IOnboardingRepository } from './domain/repositories/onboarding.repository.interface';
import { OnboardingRepository } from './infrastructure/repositories/onboarding.repository';
import { GetOnboardingStatusUseCase } from './application/use-cases/get-onboarding-status.use-case';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { UpdateOnboardingStepUseCase } from './application/use-cases/update-onboarding-step.use-case';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserOnboarding.name, schema: UserOnboardingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    GamificationModule,
  ],
  controllers: [OnboardingController],
  providers: [
    {
      provide: IOnboardingRepository,
      useClass: OnboardingRepository,
    },
    // Use Cases
    GetOnboardingStatusUseCase,
    StartOnboardingUseCase,
    UpdateOnboardingStepUseCase,
    CompleteOnboardingUseCase,
  ],
  exports: [
    IOnboardingRepository,
    GetOnboardingStatusUseCase,
    StartOnboardingUseCase,
    UpdateOnboardingStepUseCase,
    CompleteOnboardingUseCase,
  ],
})
export class OnboardingModule {}
