import { ApiTags } from '@nestjs/swagger';
import { buildPaginationMeta } from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TrackUserEventDto } from './dto/track-user-event.dto';
import { TrackUserEventCommand } from '@/modules/analytics/application/commands/track-user-event/track-user-event.command';
import { GetTrendingBooksQuery } from '@/modules/analytics/application/queries/get-trending-books/get-trending-books.query';
import { GetTopActiveReadersQuery } from '@/modules/analytics/application/queries/get-top-active-readers/get-top-active-readers.query';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
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
@UseGuards(PoliciesGuard)
export class AnalyticsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Track Event' })
  @HttpCode(204)
  @Post('events')
  @CheckPolicy('create', 'Analytics')
  async trackEvent(
    @CurrentUser('id') userId: string,
    @CurrentActor() actor: Actor,
    @Body() dto: TrackUserEventDto,
  ) {
    const command = new TrackUserEventCommand(
      actor,
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
  @CheckPolicy('read', 'Analytics')
  @ApiPaginatedResponse(TrendingBookResponseDto, 'offset')
  async getTrendingBooks(
    @CurrentActor() actor: Actor,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new GetTrendingBooksQuery(
      actor,
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
  @CheckPolicy('read', 'Analytics')
  @ApiPaginatedResponse(ActiveReaderResponseDto, 'offset')
  async getTopActiveReaders(
    @CurrentActor() actor: Actor,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new GetTopActiveReadersQuery(
      actor,
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
