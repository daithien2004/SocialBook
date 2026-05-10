import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TrackUserEventUseCase } from '@/application/analytics/use-cases/track-user-event/track-user-event.use-case';
import { TrackUserEventDto } from './dto/track-user-event.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly trackUserEventUseCase: TrackUserEventUseCase) {}

  @Post('events')
  async trackEvent(
    @CurrentUser('id') userId: string,
    @Body() dto: TrackUserEventDto,
  ) {
    await this.trackUserEventUseCase.execute(userId, dto);
    return { success: true };
  }
}
