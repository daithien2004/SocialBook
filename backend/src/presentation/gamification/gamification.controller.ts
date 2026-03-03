import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { Public } from '@/common/decorators/customize';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { RecordReadingDto } from '@/presentation/gamification/dto/user-gamification.dto';

import { RecordReadingUseCase } from '@/application/gamification/use-cases/record-reading/record-reading.use-case';
import { GetGamificationStatsUseCase } from '@/application/gamification/use-cases/get-gamification-stats/get-gamification-stats.use-case';
import { GetStreakUseCase } from '@/application/gamification/use-cases/get-streak/get-streak.use-case';
import { CheckInUseCase } from '@/application/gamification/use-cases/check-in/check-in.use-case';
import { GetDailyGoalsUseCase } from '@/application/gamification/use-cases/get-daily-goals/get-daily-goals.use-case';

import { RecordReadingCommand } from '@/application/gamification/use-cases/record-reading/record-reading.command';
import { GetGamificationStatsQuery } from '@/application/gamification/use-cases/get-gamification-stats/get-gamification-stats.query';
import { GetStreakQuery } from '@/application/gamification/use-cases/get-streak/get-streak.query';
import { CheckInCommand } from '@/application/gamification/use-cases/check-in/check-in.command';
import { GetDailyGoalsQuery } from '@/application/gamification/use-cases/get-daily-goals/get-daily-goals.query';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly recordReadingUseCase: RecordReadingUseCase,
    private readonly getGamificationStatsUseCase: GetGamificationStatsUseCase,
    private readonly getStreakUseCase: GetStreakUseCase,
    private readonly checkInUseCase: CheckInUseCase,
    private readonly getDailyGoalsUseCase: GetDailyGoalsUseCase,
  ) { }

  @Post('record-reading')
  @UseGuards(JwtAuthGuard)
  async recordReading(
    @CurrentUser('id') userId: string,
    @Body() dto: RecordReadingDto,
  ) {
    const command = new RecordReadingCommand(userId, dto.xp);
    const gamification = await this.recordReadingUseCase.execute(command);

    return {
      message: 'Reading recorded successfully',
      data: {
        currentStreak: gamification.streak.getCurrent(),
        longestStreak: gamification.streak.getLongest(),
        totalXP: gamification.totalXP.getValue(),
        level: gamification.getLevel(),
        isStreakActive: gamification.isStreakActive(),
      },
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@CurrentUser('id') userId: string) {
    const query = new GetGamificationStatsQuery(userId);
    const stats = await this.getGamificationStatsUseCase.execute(query);

    return {
      message: 'Stats retrieved successfully',
      data: stats,
    };
  }

  @Get('streak')
  @UseGuards(JwtAuthGuard)
  async getMyStreak(@CurrentUser('id') userId: string) {
    const query = new GetStreakQuery(userId);
    const stats = await this.getStreakUseCase.execute(query);

    return {
      message: 'Streak retrieved successfully',
      data: stats,
    };
  }

  @Post('streak/check-in')
  @UseGuards(JwtAuthGuard)
  async checkInStreak(@CurrentUser('id') userId: string) {
    const command = new CheckInCommand(userId);
    const gamification = await this.checkInUseCase.execute(command);

    return {
      message: 'Check-in recorded successfully',
      data: {
        currentStreak: gamification.streak.getCurrent(),
        longestStreak: gamification.streak.getLongest(),
        totalXP: gamification.totalXP.getValue(),
        level: gamification.getLevel(),
        isStreakActive: gamification.isStreakActive(),
      },
    };
  }

  @Get('daily-goals')
  @UseGuards(JwtAuthGuard)
  async getDailyGoals(@CurrentUser('id') userId: string) {
    const query = new GetDailyGoalsQuery(userId);
    const goals = await this.getDailyGoalsUseCase.execute(query);

    return {
      message: 'Daily goals retrieved successfully',
      data: goals,
    };
  }

  @Get('stats/:userId')
  @Public()
  async getUserStats(@Query('userId') userId: string) {
    const query = new GetGamificationStatsQuery(userId);
    const stats = await this.getGamificationStatsUseCase.execute(query);

    return {
      message: 'Stats retrieved successfully',
      data: stats,
    };
  }

  @Get('global-stats')
  @Public()
  async getGlobalStats() {
    const query = new GetGamificationStatsQuery();
    const stats = await this.getGamificationStatsUseCase.execute(query);

    return {
      message: 'Global stats retrieved successfully',
      data: stats,
    };
  }
}
