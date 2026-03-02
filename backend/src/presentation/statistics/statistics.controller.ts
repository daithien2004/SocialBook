import { LocationCheckService } from '@/infrastructure/external/location-check.service';
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { GetBookStatsUseCase } from '@/application/statistics/use-cases/get-book-stats.use-case';
import { GetEngagementStatsUseCase } from '@/application/statistics/use-cases/get-engagement-stats.use-case';
import { GetGrowthStatsUseCase } from '@/application/statistics/use-cases/get-growth-stats.use-case';
import { GetOverviewStatsUseCase } from '@/application/statistics/use-cases/get-overview-stats.use-case';
import { GetUserStatsUseCase } from '@/application/statistics/use-cases/get-user-stats.use-case';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin', 'editor')
export class StatisticsController {
  constructor(
    private readonly getOverviewStatsUseCase: GetOverviewStatsUseCase,
    private readonly getUserStatsUseCase: GetUserStatsUseCase,
    private readonly getBookStatsUseCase: GetBookStatsUseCase,
    private readonly getEngagementStatsUseCase: GetEngagementStatsUseCase,
    private readonly getGrowthStatsUseCase: GetGrowthStatsUseCase,
    private readonly locationCheckService: LocationCheckService,
  ) { }

  @Get('overview')
  async getOverview() {
    const data = await this.getOverviewStatsUseCase.execute();
    return {
      message: 'Get overview statistics successfully',
      data,
    };
  }

  @Get('users')
  async getUserStats() {
    const data = await this.getUserStatsUseCase.execute();
    return {
      message: 'Get user statistics successfully',
      data,
    };
  }

  @Get('books')
  async getBookStats() {
    const data = await this.getBookStatsUseCase.execute();
    return {
      message: 'Get book statistics successfully',
      data,
    };
  }

  @Get('growth')
  async getGrowth(
    @Query('days') days?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    const groupByValue = (groupBy as 'day' | 'month' | 'year') || 'day';
    const data = await this.getGrowthStatsUseCase.execute(numDays, groupByValue);
    return {
      message: 'Get growth statistics successfully',
      data,
    };
  }

  @Get('analytics/reading-heatmap')
  async getReadingHeatmap() {
    const data = await this.getEngagementStatsUseCase.getReadingHeatmap();
    return {
      message: 'Get reading heatmap successfully',
      data,
    };
  }

  @Get('analytics/chapter-engagement')
  async getChapterEngagement(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    const data = await this.getEngagementStatsUseCase.getChapterEngagement(numLimit);
    return {
      message: 'Get chapter engagement successfully',
      data,
    };
  }

  @Get('analytics/reading-speed')
  async getReadingSpeed(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const data = await this.getEngagementStatsUseCase.getReadingSpeed(numDays);
    return {
      message: 'Get reading speed successfully',
      data,
    };
  }

  @Get('analytics/active-users')
  async getActiveUsers() {
    const data = await this.getEngagementStatsUseCase.getActiveUsers();
    return {
      message: 'Get active users successfully',
      data,
    };
  }

  @Get('analytics/geographic')
  async getGeographicDistribution() {
    const data = await this.getEngagementStatsUseCase.getGeographicDistribution();
    return {
      message: 'Get geographic distribution successfully',
      data,
    };
  }

  @Get('check-locations')
  async checkLocations() {
    const result = await this.locationCheckService.checkUserLocations();
    return {
      message: 'Location check completed',
      data: result,
    };
  }

  @Post('seed-locations')
  async seedLocations() {
    const result = await this.locationCheckService.seedLocations();
    return {
      message: 'Location seeding completed',
      data: result,
    };
  }

  @Post('seed-reading-history')
  async seedReadingHistory(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const result = await this.locationCheckService.seedReadingHistory(numDays);
    return {
      message: 'Reading history seeding completed',
      data: result,
    };
  }
}
