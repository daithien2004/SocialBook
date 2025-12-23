import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UserGamification, UserGamificationSchema } from '../gamification/schemas/user-gamification.schema';
import { UserOnboarding, UserOnboardingSchema } from './schemas/user-onboarding.schema';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserOnboarding.name, schema: UserOnboardingSchema },
      { name: User.name, schema: UserSchema },
      { name: UserGamification.name, schema: UserGamificationSchema },
    ]),
    GamificationModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
