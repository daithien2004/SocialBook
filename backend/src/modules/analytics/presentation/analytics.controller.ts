import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { TrackUserEventDto } from './dto/track-user-event.dto';
import { TrackUserEventCommand } from '@/modules/analytics/application/commands/track-user-event/track-user-event.command';
import { GetTrendingBooksQuery } from '@/modules/analytics/application/queries/get-trending-books/get-trending-books.query';
import { GetTopActiveReadersQuery } from '@/modules/analytics/application/queries/get-top-active-readers/get-top-active-readers.query';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/custom.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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
    return { success: true };
  }

  @Public()
  @Get('trending-books')
  async getTrendingBooks(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new GetTrendingBooksQuery(
      days ? parseInt(days, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    const data = await this.queryBus.execute(query);
    return { data };
  }

  @Public()
  @Get('top-readers')
  async getTopActiveReaders(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new GetTopActiveReadersQuery(
      days ? parseInt(days, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    const data = await this.queryBus.execute(query);
    return { data };
  }
}
