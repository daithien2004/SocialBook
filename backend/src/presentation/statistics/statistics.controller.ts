import { LocationCheckService } from '@/infrastructure/external/location-check.service';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Get system overview statistics' })
  @ApiResponse({ status: 200, description: 'Return system overview statistics' })
  @HttpCode(HttpStatus.OK)
  async getOverview() {
    const data = await this.getOverviewStatsUseCase.execute();
    return {
      message: 'Get overview statistics successfully',
      data,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Return user statistics' })
  @HttpCode(HttpStatus.OK)
  async getUserStats() {
    const data = await this.getUserStatsUseCase.execute();
    return {
      message: 'Get user statistics successfully',
      data,
    };
  }

  @Get('books')
  @ApiOperation({ summary: 'Get book statistics' })
  @ApiResponse({ status: 200, description: 'Return book statistics' })
  @HttpCode(HttpStatus.OK)
  async getBookStats() {
    const data = await this.getBookStatsUseCase.execute();
    return {
      message: 'Get book statistics successfully',
      data,
    };
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get growth metrics over time' })
  @ApiResponse({ status: 200, description: 'Return growth metrics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look back (default: 30)' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Group by period (default: day)' })
  @HttpCode(HttpStatus.OK)
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
  @ApiOperation({ summary: 'Get reading heatmap data' })
  @ApiResponse({ status: 200, description: 'Return reading heatmap data' })
  @HttpCode(HttpStatus.OK)
  async getReadingHeatmap() {
    const data = await this.getEngagementStatsUseCase.getReadingHeatmap();
    return {
      message: 'Get reading heatmap successfully',
      data,
    };
  }

  @Get('analytics/chapter-engagement')
  @ApiOperation({ summary: 'Get chapter engagement data' })
  @ApiResponse({ status: 200, description: 'Return chapter engagement data' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  async getChapterEngagement(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    const data = await this.getEngagementStatsUseCase.getChapterEngagement(numLimit);
    return {
      message: 'Get chapter engagement successfully',
      data,
    };
  }

  @Get('analytics/reading-speed')
  @ApiOperation({ summary: 'Get reading speed data' })
  @ApiResponse({ status: 200, description: 'Return reading speed data' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  async getReadingSpeed(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const data = await this.getEngagementStatsUseCase.getReadingSpeed(numDays);
    return {
      message: 'Get reading speed successfully',
      data,
    };
  }

  @Get('analytics/active-users')
  @ApiOperation({ summary: 'Get real-time active users count' })
  @ApiResponse({ status: 200, description: 'Return active users count' })
  @HttpCode(HttpStatus.OK)
  async getActiveUsers() {
    const data = await this.getEngagementStatsUseCase.getActiveUsers();
    return {
      message: 'Get active users successfully',
      data,
    };
  }

  @Get('analytics/geographic')
  @ApiOperation({ summary: 'Get geographic distribution data' })
  @ApiResponse({ status: 200, description: 'Return geographic distribution data' })
  @HttpCode(HttpStatus.OK)
  async getGeographicDistribution() {
    const data = await this.getEngagementStatsUseCase.getGeographicDistribution();
    return {
      message: 'Get geographic distribution successfully',
      data,
    };
  }

  @Get('check-locations')
  @HttpCode(HttpStatus.OK)
  async checkLocations() {
    const result = await this.locationCheckService.checkUserLocations();
    return {
      message: 'Location check completed',
      data: result,
    };
  }

  @Post('seed-locations')
  @HttpCode(HttpStatus.OK)
  async seedLocations() {
    const result = await this.locationCheckService.seedLocations();
    return {
      message: 'Location seeding completed',
      data: result,
    };
  }

  @Post('seed-reading-history')
  @HttpCode(HttpStatus.OK)
  async seedReadingHistory(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const result = await this.locationCheckService.seedReadingHistory(numDays);
    return {
      message: 'Reading history seeding completed',
      data: result,
    };
  }
}
