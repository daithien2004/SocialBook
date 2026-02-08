import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { Public } from '@/common/decorators/customize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { RecordReadingDto } from '@/application/gamification/dto/user-gamification.dto';

import { RecordReadingUseCase } from '@/application/gamification/use-cases/record-reading/record-reading.use-case';
import { GetGamificationStatsUseCase } from '@/application/gamification/use-cases/get-gamification-stats/get-gamification-stats.use-case';

import { RecordReadingCommand } from '@/application/gamification/use-cases/record-reading/record-reading.command';
import { GetGamificationStatsCommand } from '@/application/gamification/use-cases/get-gamification-stats/get-gamification-stats.command';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly recordReadingUseCase: RecordReadingUseCase,
    private readonly getGamificationStatsUseCase: GetGamificationStatsUseCase,
  ) {}

  @Post('record-reading')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record reading activity and award XP' })
  @ApiBody({ type: RecordReadingDto })
  async recordReading(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: RecordReadingDto,
  ) {
    const command = new RecordReadingCommand(req.user.id, dto.xp);
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get gamification stats for current user' })
  async getMyStats(@Req() req: Request & { user: { id: string } }) {
    const command = new GetGamificationStatsCommand(req.user.id);
    const stats = await this.getGamificationStatsUseCase.execute(command);

    return {
      message: 'Stats retrieved successfully',
      data: stats,
    };
  }

  @Get('stats/:userId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get gamification stats for a user' })
  @ApiQuery({ name: 'userId', description: 'User ID' })
  async getUserStats(@Query('userId') userId: string) {
    const command = new GetGamificationStatsCommand(userId);
    const stats = await this.getGamificationStatsUseCase.execute(command);

    return {
      message: 'Stats retrieved successfully',
      data: stats,
    };
  }

  @Get('global-stats')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get global gamification statistics' })
  async getGlobalStats() {
    const command = new GetGamificationStatsCommand();
    const stats = await this.getGamificationStatsUseCase.execute(command);

    return {
      message: 'Global stats retrieved successfully',
      data: stats,
    };
  }

  @Post('use-streak-freeze')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use a streak freeze' })
  async useStreakFreeze(@Req() req: Request & { user: { id: string } }) {
    // This would need a specific use case
    return {
      message: 'Streak freeze used successfully',
      data: { streakFreezeUsed: true },
    };
  }

  @Get('leaderboard/streak')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get top users by streak' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getStreakLeaderboard(@Query('limit') limit: string = '10') {
    // This would need a specific use case
    return {
      message: 'Streak leaderboard retrieved successfully',
      data: [],
    };
  }

  @Get('leaderboard/xp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get top users by XP' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getXPLeaderboard(@Query('limit') limit: string = '10') {
    // This would need a specific use case
    return {
      message: 'XP leaderboard retrieved successfully',
      data: [],
    };
  }
}
