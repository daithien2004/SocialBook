import { ApiTags } from '@nestjs/swagger';
import { buildPaginationMeta } from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';

import { TrackUserEventDto } from './dto/track-user-event.dto';
import { TrackUserEventCommand } from '@/modules/analytics/application/commands/track-user-event/track-user-event.command';
import { GetTrendingBooksQuery } from '@/modules/analytics/application/queries/get-trending-books/get-trending-books.query';
import { GetTopActiveReadersQuery } from '@/modules/analytics/application/queries/get-top-active-readers/get-top-active-readers.query';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { ApiProperty, ApiOperation } from '@nestjs/swagger';

class TrendingBookResponseDto {
  @ApiProperty()
  bookId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  coverImage!: string | null;

  @ApiProperty()
  score!: number;
}

class ActiveReaderResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ nullable: true })
  avatar!: string | null;

  @ApiProperty()
  score!: number;
}

@ApiProblemResponses()
@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Track Event' })
  @HttpCode(204)
  @Post('events')
  async trackEvent(
    @CurrentUser('id') userId: string,
    @Body() dto: TrackUserEventDto,
  ) {
    const command = new TrackUserEventCommand(
      userId,
      dto.eventType,
      dto.bookId,
      dto.chapterId,
      dto.durationSeconds,
      dto.progressPercent,
      dto.source,
      dto.deviceType,
      dto.metadata,
      dto.sessionId,
    );
    await this.commandBus.execute(command);
  }

  @ApiOperation({ summary: 'Get Trending Books' })
  @Public()
  @Get('trending-books')
  @ApiPaginatedResponse(TrendingBookResponseDto, 'offset')
  async getTrendingBooks(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new GetTrendingBooksQuery(
      days ? parseInt(days, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    const data = await this.queryBus.execute(query);
    return {
      data: data,
      meta: buildPaginationMeta(1, Math.max(data.length, 1), data.length),
    };
  }

  @ApiOperation({ summary: 'Get Top Active Readers' })
  @Public()
  @Get('top-readers')
  @ApiPaginatedResponse(ActiveReaderResponseDto, 'offset')
  async getTopActiveReaders(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new GetTopActiveReadersQuery(
      days ? parseInt(days, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    const data = await this.queryBus.execute(query);
    return {
      data: data,
      meta: buildPaginationMeta(1, Math.max(data.length, 1), data.length),
    };
  }
}
