import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserOnboarding } from './schemas/user-onboarding.schema';
import { User } from '../users/schemas/user.schema';
import { UserGamification } from '../gamification/schemas/user-gamification.schema';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(UserOnboarding.name) private userOnboardingModel: Model<UserOnboarding>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserGamification.name) private userGamificationModel: Model<UserGamification>,
    private readonly gamificationService: GamificationService,
  ) { }

  async getOnboardingStatus(userId: string) {
    const onboarding = await this.userOnboardingModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!onboarding) {
      return { isCompleted: false, currentStep: 1 };
    }
    return {
      isCompleted: onboarding.isCompleted,
      currentStep: onboarding.currentStep
    };
  }

  async startOnboarding(userId: string) {
    const existing = await this.userOnboardingModel.findOne({ userId: new Types.ObjectId(userId) });
    if (existing) {
      return existing;
    }

    const newOnboarding = await this.userOnboardingModel.create({
      userId: new Types.ObjectId(userId),
      currentStep: 1,
      isCompleted: false
    });

    await this.userModel.findByIdAndUpdate(new Types.ObjectId(userId), {
      onboardingId: newOnboarding._id
    });

    return newOnboarding;
  }

  async updateStep(userId: string, step: number, data: any) {
    const onboarding = await this.userOnboardingModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!onboarding) {
      throw new NotFoundException('Onboarding session not found. Please start onboarding first.');
    }

    if (onboarding.isCompleted) {
      return onboarding;
    }

    if (step === 1 && data.favoriteGenres) {
      onboarding.favoriteGenres = data.favoriteGenres.map(id => new Types.ObjectId(id));
    } else if (step === 2 && data.readingGoal) {
      onboarding.readingGoalType = data.readingGoal.type;
      onboarding.readingGoalTarget = data.readingGoal.amount;
      onboarding.readingGoalUnit = data.readingGoal.unit;
    } else if (step === 3 && data.readingTime) {
      onboarding.readingTime = data.readingTime;
    }

    onboarding.currentStep = step + 1;
    return onboarding.save();
  }

  async completeOnboarding(userId: string) {
    const onboarding = await this.userOnboardingModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!onboarding) {
      throw new NotFoundException('Onboarding session not found');
    }

    onboarding.isCompleted = true;
    onboarding.completedAt = new Date();
    await onboarding.save();

    let gamification = await this.userGamificationModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!gamification) {
      gamification = await this.userGamificationModel.create({
        userId: new Types.ObjectId(userId),
        currentStreak: 1,
        longestStreak: 1,
        lastReadDate: new Date()
      });
    }

    await this.userModel.findByIdAndUpdate(userId, {
      onboardingCompleted: true,
      gamificationId: gamification._id,
    });

    await this.gamificationService.unlockAchievement(userId, 'NEWBIE');

    return { success: true };
  }
}
