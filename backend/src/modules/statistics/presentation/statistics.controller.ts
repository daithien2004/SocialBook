import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import type { Actor } from '@/shared/casl/actor';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { GetOverviewStatsQuery } from '@/modules/statistics/application/queries/get-overview-stats/get-overview-stats.query';
import { GetUserStatsQuery } from '@/modules/statistics/application/queries/get-user-stats/get-user-stats.query';
import { GetBookStatsQuery } from '@/modules/statistics/application/queries/get-book-stats/get-book-stats.query';
import { GetReadingHeatmapQuery } from '@/modules/statistics/application/queries/get-reading-heatmap/get-reading-heatmap.query';
import { GetActiveUsersQuery } from '@/modules/statistics/application/queries/get-active-users/get-active-users.query';
import { GetGeographicDistributionQuery } from '@/modules/statistics/application/queries/get-geographic-distribution/get-geographic-distribution.query';
import { CheckUserLocationsQuery } from '@/modules/statistics/application/queries/check-user-locations/check-user-locations.query';
import {
  ChapterEngagementQueryDto,
  GrowthStatsQueryDto,
  ReadingSpeedQueryDto,
} from './dto/statistics-query.dto';
import {
  ActiveUsersResponseDto,
  BookStatsResponseDto,
  ChapterEngagementResponseDto,
  GeographicResponseDto,
  GrowthMetricResponseDto,
  OverviewStatsResponseDto,
  ReadingHeatmapResponseDto,
  ReadingSpeedResponseDto,
  UserLocationSummaryResponseDto,
  UserStatsResponseDto,
} from './dto/statistics.response.dto';

@ApiProblemResponses([401, 403, 500])
@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(PoliciesGuard)
@CheckPolicy('read', 'Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overview statistics' })
  @ApiOkResponse({ type: OverviewStatsResponseDto })
  async getOverview(
    @CurrentActor() actor: Actor,
  ): Promise<OverviewStatsResponseDto> {
    const result = await this.queryBus.execute(
      new GetOverviewStatsQuery(actor),
    );
    return OverviewStatsResponseDto.fromReadModel(result);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiOkResponse({ type: UserStatsResponseDto })
  async getUserStats(
    @CurrentActor() actor: Actor,
  ): Promise<UserStatsResponseDto> {
    const result = await this.queryBus.execute(new GetUserStatsQuery(actor));
    return UserStatsResponseDto.fromReadModel(result);
  }

  @Get('books')
  @ApiOperation({ summary: 'Get book statistics' })
  @ApiOkResponse({ type: BookStatsResponseDto })
  async getBookStats(
    @CurrentActor() actor: Actor,
  ): Promise<BookStatsResponseDto> {
    const result = await this.queryBus.execute(new GetBookStatsQuery(actor));
    return BookStatsResponseDto.fromReadModel(result);
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get growth statistics' })
  @ApiProblemResponses([400])
  @ApiOkResponse({ type: [GrowthMetricResponseDto] })
  async getGrowth(
    @CurrentActor() actor: Actor,
    @Query() dto: GrowthStatsQueryDto,
  ): Promise<GrowthMetricResponseDto[]> {
    const result = await this.queryBus.execute(dto.toQuery(actor));
    return result.map((metric) =>
      GrowthMetricResponseDto.fromReadModel(metric),
    );
  }

  @Get('analytics/reading-heatmap')
  @ApiOperation({ summary: 'Get reading activity by hour' })
  @ApiOkResponse({ type: [ReadingHeatmapResponseDto] })
  async getReadingHeatmap(
    @CurrentActor() actor: Actor,
  ): Promise<ReadingHeatmapResponseDto[]> {
    const result = await this.queryBus.execute(
      new GetReadingHeatmapQuery(actor),
    );
    return result.map((item) => ReadingHeatmapResponseDto.fromReadModel(item));
  }

  @Get('analytics/chapter-engagement')
  @ApiOperation({ summary: 'Get chapter engagement statistics' })
  @ApiProblemResponses([400])
  @ApiOkResponse({ type: [ChapterEngagementResponseDto] })
  async getChapterEngagement(
    @CurrentActor() actor: Actor,
    @Query() dto: ChapterEngagementQueryDto,
  ): Promise<ChapterEngagementResponseDto[]> {
    const result = await this.queryBus.execute(dto.toQuery(actor));
    return result.map((item) =>
      ChapterEngagementResponseDto.fromReadModel(item),
    );
  }

  @Get('analytics/reading-speed')
  @ApiOperation({ summary: 'Get reading speed statistics' })
  @ApiProblemResponses([400])
  @ApiOkResponse({ type: [ReadingSpeedResponseDto] })
  async getReadingSpeed(
    @CurrentActor() actor: Actor,
    @Query() dto: ReadingSpeedQueryDto,
  ): Promise<ReadingSpeedResponseDto[]> {
    const result = await this.queryBus.execute(dto.toQuery(actor));
    return result.map((item) => ReadingSpeedResponseDto.fromReadModel(item));
  }

  @Get('analytics/active-users')
  @ApiOperation({ summary: 'Get active user statistics' })
  @ApiOkResponse({ type: ActiveUsersResponseDto })
  async getActiveUsers(
    @CurrentActor() actor: Actor,
  ): Promise<ActiveUsersResponseDto> {
    const result = await this.queryBus.execute(new GetActiveUsersQuery(actor));
    return ActiveUsersResponseDto.fromReadModel(result);
  }

  @Get('analytics/geographic')
  @ApiOperation({ summary: 'Get geographic user statistics' })
  @ApiOkResponse({ type: [GeographicResponseDto] })
  async getGeographicDistribution(
    @CurrentActor() actor: Actor,
  ): Promise<GeographicResponseDto[]> {
    const result = await this.queryBus.execute(
      new GetGeographicDistributionQuery(actor),
    );
    return result.map((item) => GeographicResponseDto.fromReadModel(item));
  }

  @Get('check-locations')
  @ApiOperation({ summary: 'Check users with location data' })
  @ApiOkResponse({ type: UserLocationSummaryResponseDto })
  async checkLocations(
    @CurrentActor() actor: Actor,
  ): Promise<UserLocationSummaryResponseDto> {
    const result = await this.queryBus.execute(
      new CheckUserLocationsQuery(actor),
    );
    return UserLocationSummaryResponseDto.fromReadModel(result);
  }
}
