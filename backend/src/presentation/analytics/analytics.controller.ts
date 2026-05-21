import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TrackUserEventUseCase } from '@/application/analytics/use-cases/track-user-event/track-user-event.use-case';
import { GetTrendingBooksUseCase } from '@/application/analytics/use-cases/get-trending-books/get-trending-books.use-case';
import { GetTopActiveReadersUseCase } from '@/application/analytics/use-cases/get-top-active-readers/get-top-active-readers.use-case';
import { TrackUserEventDto } from './dto/track-user-event.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/customize';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly trackUserEventUseCase: TrackUserEventUseCase,
    private readonly getTrendingBooksUseCase: GetTrendingBooksUseCase,
    private readonly getTopActiveReadersUseCase: GetTopActiveReadersUseCase,
  ) {}

  @Post('events')
  async trackEvent(
    @CurrentUser('id') userId: string,
    @Body() dto: TrackUserEventDto,
  ) {
    await this.trackUserEventUseCase.execute(userId, dto);
    return { success: true };
  }

  @Public()
  @Get('trending-books')
  async getTrendingBooks(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.getTrendingBooksUseCase.execute(
      days ? parseInt(days, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    return { data };
  }

  @Public()
  @Get('top-readers')
  async getTopActiveReaders(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.getTopActiveReadersUseCase.execute(
      days ? parseInt(days, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    return { data };
  }
}
