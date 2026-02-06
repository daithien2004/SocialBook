import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { Request } from 'express';
import { GamificationService } from './gamification.service';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Get('achievements')
  async getAchievements(@Req() req: Request & { user: { id: string } }) {

    const data = await this.gamificationService.getUserAchievements(req.user.id);
    return {
      message: 'Get user achievements successfully',
      data,
    };
  }

  @Post('streak/check-in')
  async checkInStreak(@Req() req: Request & { user: { id: string } }) {

    const data = await this.gamificationService.updateStreak(req.user.id);
    return {
      message: 'Check-in user streak successfully',
      data,
    };
  }

  @Get('streak')
  async getStreak(@Req() req: Request & { user: { id: string } }) {

    const data = await this.gamificationService.getStreak(req.user.id);
    return {
      message: 'Get user streak successfully',
      data,
    };
  }

  @Get('daily-goals')
  async getDailyGoals(@Req() req: Request & { user: { id: string } }) {
    const data = await this.gamificationService.getDailyGoal(req.user.id);
    return {
      message: 'Get user daily goals successfully',
      data,
    };
  }

  @Post('debug/set-streak')
  async debugSetStreak(@Req() req: Request & { user: { id: string } }, @Body() body: { streak: number }) {
    const data = await this.gamificationService.debugSetStreak(req.user.id, body.streak);
    return {
      message: 'Set user streak successfully',
      data,
    };
  }
}
