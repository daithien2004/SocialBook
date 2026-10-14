import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { Actor } from '@/shared/casl/actor';
import {
  GetGrowthStatsQuery,
  type GrowthGroupBy,
} from '@/modules/statistics/application/queries/get-growth-stats/get-growth-stats.query';
import { GetChapterEngagementQuery } from '@/modules/statistics/application/queries/get-chapter-engagement/get-chapter-engagement.query';
import { GetReadingSpeedQuery } from '@/modules/statistics/application/queries/get-reading-speed/get-reading-speed.query';

const GROWTH_GROUPS = ['day', 'month', 'year'] as const;

export class GrowthStatsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 365, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days = 30;

  @ApiPropertyOptional({ enum: GROWTH_GROUPS, default: 'day' })
  @IsOptional()
  @IsIn(GROWTH_GROUPS)
  groupBy?: GrowthGroupBy;

  toQuery(actor: Actor): GetGrowthStatsQuery {
    return new GetGrowthStatsQuery(actor, this.days, this.groupBy ?? 'day');
  }
}

export class ChapterEngagementQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  toQuery(actor: Actor): GetChapterEngagementQuery {
    return new GetChapterEngagementQuery(actor, this.limit);
  }
}

export class ReadingSpeedQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 365, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days = 30;

  toQuery(actor: Actor): GetReadingSpeedQuery {
    return new GetReadingSpeedQuery(actor, this.days);
  }
}
