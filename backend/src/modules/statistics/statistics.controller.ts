import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';

import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview() {
    const data = await this.statisticsService.getOverview();
    return {
      message: 'Get overview statistics successfully',
      data,
    };
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  async getUserStats() {
    const data = await this.statisticsService.getUserStats();
    return {
      message: 'Get user statistics successfully',
      data,
    };
  }

  @Get('books')
  @HttpCode(HttpStatus.OK)
  async getBookStats() {
    const data = await this.statisticsService.getBookStats();
    return {
      message: 'Get book statistics successfully',
      data,
    };
  }

  @Get('posts')
  @HttpCode(HttpStatus.OK)
  async getPostStats() {
    const data = await this.statisticsService.getPostStats();
    return {
      message: 'Get post statistics successfully',
      data,
    };
  }

  @Get('growth')
  @HttpCode(HttpStatus.OK)
  async getGrowthMetrics(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const data = await this.statisticsService.getGrowthMetrics(numDays);
    return {
      message: 'Get growth metrics successfully',
      data,
    };
  }
}
