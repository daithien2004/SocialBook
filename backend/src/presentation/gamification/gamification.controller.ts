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

import { RecordReadingDto } from '@/presentation/gamification/dto/user-gamification.dto';

import { RecordReadingUseCase } from '@/application/gamification/use-cases/record-reading/record-reading.use-case';
import { GetGamificationStatsUseCase } from '@/application/gamification/use-cases/get-gamification-stats/get-gamification-stats.use-case';

import { RecordReadingCommand } from '@/application/gamification/use-cases/record-reading/record-reading.command';
import { GetGamificationStatsQuery } from '@/application/gamification/use-cases/get-gamification-stats/get-gamification-stats.query';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly recordReadingUseCase: RecordReadingUseCase,
    private readonly getGamificationStatsUseCase: GetGamificationStatsUseCase,
  ) { }

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
    const query = new GetGamificationStatsQuery(req.user.id);
    const stats = await this.getGamificationStatsUseCase.execute(query);

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
    const query = new GetGamificationStatsQuery(userId);
    const stats = await this.getGamificationStatsUseCase.execute(query);

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
    const query = new GetGamificationStatsQuery();
    const stats = await this.getGamificationStatsUseCase.execute(query);

    return {
      message: 'Global stats retrieved successfully',
      data: stats,
    };
  }
}
