import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ProgressMigrationService } from '../library/progress-migration.service';
import { LocationCheckService } from './location-check.service';

import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly progressMigrationService: ProgressMigrationService,
    private readonly locationCheckService: LocationCheckService,
  ) { }

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
  async getGrowthMetrics(
    @Query('days') days?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    const validGroupBy = ['day', 'month', 'year'].includes(groupBy || '')
      ? (groupBy as 'day' | 'month' | 'year')
      : 'day';
    const data = await this.statisticsService.getGrowthMetrics(
      numDays,
      validGroupBy,
    );
    return {
      message: 'Get growth metrics successfully',
      data,
    };
  }

  // ============ Advanced Analytics Endpoints ============

  @Get('analytics/reading-heatmap')
  @HttpCode(HttpStatus.OK)
  async getReadingHeatmap() {
    const data = await this.statisticsService.getReadingHeatmap();
    return {
      message: 'Get reading heatmap successfully',
      data,
    };
  }

  @Get('analytics/chapter-engagement')
  @HttpCode(HttpStatus.OK)
  async getChapterEngagement(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    const data = await this.statisticsService.getChapterEngagement(numLimit);
    return {
      message: 'Get chapter engagement successfully',
      data,
    };
  }

  @Get('analytics/reading-speed')
  @HttpCode(HttpStatus.OK)
  async getReadingSpeed(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const data = await this.statisticsService.getReadingSpeed(numDays);
    return {
      message: 'Get reading speed successfully',
      data,
    };
  }

  @Get('analytics/geographic')
  @HttpCode(HttpStatus.OK)
  async getGeographicDistribution() {
    const data = await this.statisticsService.getGeographicDistribution();
    return {
      message: 'Get geographic distribution successfully',
      data,
    };
  }

  @Get('analytics/active-users')
  @HttpCode(HttpStatus.OK)
  async getActiveUsers() {
    const data = await this.statisticsService.getActiveUsers();
    return {
      message: 'Get active users successfully',
      data,
    };
  }

  /**
   * Sets status to 'completed' if progress >= 80%, otherwise 'reading'
   */
  @Post('migrate-progress-status')
  @HttpCode(HttpStatus.OK)
  async migrateProgressStatus() {
    const result = await this.progressMigrationService.migrateProgressStatus();
    return {
      message: 'Progress status migration completed',
      data: result,
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
