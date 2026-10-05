import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

import { GetBookStatsHandler } from '@/application/statistics/queries/get-book-stats/get-book-stats.handler';
import { GetEngagementStatsHandler } from '@/application/statistics/queries/get-engagement-stats/get-engagement-stats.handler';
import { GetGrowthStatsHandler } from '@/application/statistics/queries/get-growth-stats/get-growth-stats.handler';
import { GetOverviewStatsHandler } from '@/application/statistics/queries/get-overview-stats/get-overview-stats.handler';
import { GetUserStatsHandler } from '@/application/statistics/queries/get-user-stats/get-user-stats.handler';
import { CheckUserLocationsHandler } from '@/application/statistics/commands/check-user-locations/check-user-locations.handler';

@Controller('statistics')
@UseGuards(RolesGuard)
@Roles('admin', 'editor')
export class StatisticsController {
  constructor(
    private readonly getOverviewStatsUseCase: GetOverviewStatsHandler,
    private readonly getUserStatsUseCase: GetUserStatsHandler,
    private readonly getBookStatsUseCase: GetBookStatsHandler,
    private readonly getEngagementStatsUseCase: GetEngagementStatsHandler,
    private readonly getGrowthStatsUseCase: GetGrowthStatsHandler,
    private readonly checkUserLocationsUseCase: CheckUserLocationsHandler,
  ) {}

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
    const data = await this.getGrowthStatsUseCase.execute(
      numDays,
      groupByValue,
    );
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
    const data =
      await this.getEngagementStatsUseCase.getChapterEngagement(numLimit);
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
    const data =
      await this.getEngagementStatsUseCase.getGeographicDistribution();
    return {
      message: 'Get geographic distribution successfully',
      data,
    };
  }

  @Get('check-locations')
  async checkLocations() {
    const result = await this.checkUserLocationsUseCase.execute();
    return {
      message: 'Location check completed',
      data: result,
    };
  }
}
