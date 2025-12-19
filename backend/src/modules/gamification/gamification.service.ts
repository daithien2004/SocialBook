import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserGamification } from './schemas/user-gamification.schema';
import { Achievement } from './schemas/achievement.schema';
import { UserAchievement } from './schemas/user-achievement.schema';
import { DailyGoal } from './schemas/daily-goal.schema';
import { Leaderboard } from './schemas/leaderboard.schema';
import { UserOnboarding } from '../onboarding/schemas/user-onboarding.schema';

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(UserGamification.name) private userGamificationModel: Model<UserGamification>,
    @InjectModel(Achievement.name) private achievementModel: Model<Achievement>,
    @InjectModel(UserAchievement.name) private userAchievementModel: Model<UserAchievement>,
    @InjectModel(DailyGoal.name) private dailyGoalModel: Model<DailyGoal>,
    @InjectModel(Leaderboard.name) private leaderboardModel: Model<Leaderboard>,
    @InjectModel(UserOnboarding.name) private userOnboardingModel: Model<UserOnboarding>,
  ) { }

  async getDailyGoal(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyGoal = await this.dailyGoalModel.findOne({ userId, date: today });

    if (!dailyGoal) {
      // Default to 90 minutes as requested
      dailyGoal = await this.dailyGoalModel.create({
        userId,
        date: today,
        goals: {
          minutes: {
            target: 90,
            current: 0,
            completed: false
          }
        }
      });
    }

    return dailyGoal;
  }

  async updateDailyProgress(userId: string, minutes: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyGoal = await this.dailyGoalModel.findOne({ userId, date: today });

    if (!dailyGoal) {
      dailyGoal = (await this.getDailyGoal(userId)) as any;
    }

    if (dailyGoal) {
      if (!dailyGoal.goals.minutes) {
        dailyGoal.goals.minutes = { target: 90, current: 0, completed: false };
      }

      dailyGoal.goals.minutes.current += minutes;

      // Check completion
      if (dailyGoal.goals.minutes.current >= dailyGoal.goals.minutes.target) {
        dailyGoal.goals.minutes.completed = true;
      }

      dailyGoal.markModified('goals');

      await dailyGoal.save();
    }
  }

  async updateStreak(userId: string) {
    const userGamification = await this.userGamificationModel.findOne({ userId: new Types.ObjectId(userId) });

    if (!userGamification) {
      return { message: 'User gamification profile not found', streak: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastRead = userGamification.lastReadDate ? new Date(userGamification.lastReadDate) : null;
    if (lastRead) {
      lastRead.setHours(0, 0, 0, 0);
    }

    if (lastRead && lastRead.getTime() === today.getTime()) {
      return {
        message: 'Streak already updated today',
        currentStreak: userGamification.currentStreak,
        longestStreak: userGamification.longestStreak
      };
    }

    const oneDayMs = 24 * 60 * 60 * 1000;
    const isConsecutive = lastRead && (today.getTime() - lastRead.getTime() === oneDayMs);

    if (isConsecutive) {
      userGamification.currentStreak += 1;
    } else {
      userGamification.currentStreak = 1;
    }

    if (userGamification.currentStreak > userGamification.longestStreak) {
      userGamification.longestStreak = userGamification.currentStreak;
    }

    userGamification.lastReadDate = today;

    await this.checkStreakAchievements(userGamification, userId);

    await userGamification.save();

    return {
      message: 'Streak updated',
      currentStreak: userGamification.currentStreak,
      longestStreak: userGamification.longestStreak
    };
  }

  async getStreak(userId: string) {
    const userGamification = await this.userGamificationModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!userGamification) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    return {
      currentStreak: userGamification.currentStreak,
      longestStreak: userGamification.longestStreak,
      lastReadDate: userGamification.lastReadDate
    };
  }

  async checkStreakAchievements(userGamification: any, userId: string) {
    const streak = userGamification.currentStreak;
    const milestones = [10, 20, 50, 100];

    for (const milestone of milestones) {
      if (streak >= milestone) {
        const code = `STREAK_${milestone}`;
        await this.unlockAchievement(userId, code);
      }
    }
  }

  async unlockAchievement(userId: string, achievementCode: string) {
    let achievement = await this.achievementModel.findOne({ code: achievementCode });

    if (!achievement) {
      achievement = await this.achievementModel.create({
        code: achievementCode,
        name: `Chuỗi đọc ${achievementCode.split('_')[1]} ngày`,
        description: `Duy trì chuỗi đọc sách trong ${achievementCode.split('_')[1]} ngày liên tiếp`,
        category: 'streak',
        requirement: { type: 'streak_days', value: parseInt(achievementCode.split('_')[1]) },
        rarity: 'common',
        isActive: true
      });
    }

    if (!achievement) return;

    const existing = await this.userAchievementModel.findOne({
      userId: new Types.ObjectId(userId),
      achievementId: achievement._id
    });

    if (existing) return;

    await this.userAchievementModel.create({
      userId: new Types.ObjectId(userId),
      achievementId: achievement._id,
      unlockedAt: new Date(),
      progress: 100,
      isNotified: false
    });
  }

  async getUserAchievements(userId: string) {
    return this.userAchievementModel.find({ userId: new Types.ObjectId(userId) })
      .populate('achievementId')
      .sort({ unlockedAt: -1 })
      .exec();
  }
}
