import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { Request } from 'express';
import { GamificationService } from './gamification.service';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Get('achievements')
  async getAchievements(@Req() req: Request & { user: { id: string } }) {
    return this.gamificationService.getUserAchievements(req.user.id);
  }

  @Post('streak/check-in')
  async checkInStreak(@Req() req: Request & { user: { id: string } }) {
    return await this.gamificationService.updateStreak(req.user.id);
  }

  @Get('streak')
  async getStreak(@Req() req: Request & { user: { id: string } }) {
    return await this.gamificationService.getStreak(req.user.id);
  }

  @Get('daily-goals')
  async getDailyGoals(@Req() req: Request & { user: { id: string } }) {
    return await this.gamificationService.getDailyGoal(req.user.id);
  }

  @Post('debug/set-streak')
  async debugSetStreak(@Req() req: Request & { user: { id: string } }, @Body() body: { streak: number }) {
    return await this.gamificationService.debugSetStreak(req.user.id, body.streak);
  }
}
