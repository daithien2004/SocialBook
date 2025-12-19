import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Get('stats')
  getStats(@Req() req) {
    // return this.gamificationService.getStats(req.user.userId);
  }

  @Get('achievements')
  async getAchievements(@Req() req) {
    return this.gamificationService.getUserAchievements(req.user.id);
  }

  @Post('streak/check-in')
  async checkInStreak(@Req() req) {
    return await this.gamificationService.updateStreak(req.user.id);
  }

  @Get('streak')
  async getStreak(@Req() req) {
    return await this.gamificationService.getStreak(req.user.id);
  }

  @Get('daily-goals')
  async getDailyGoals(@Req() req) {
    return await this.gamificationService.getDailyGoal(req.user.id);
  }
}
