import { Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReminderService {
  constructor() {} // Inject other services like GamificationService, local UsersService if needed // private readonly notificationsService: NotificationsService,

  async checkDailyGoals() {
    // Run every day
  }

  async sendStreakReminders() {
    // Run every evening
  }

  async sendGoalReminders() {
    // Run at user's preferred time
  }

  async getOptimalReminderTime(userId: string) {
    // Logic
  }
}
