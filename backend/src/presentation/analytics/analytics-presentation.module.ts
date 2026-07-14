import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsApplicationModule } from '@/application/analytics/analytics-application.module';

@Module({
  imports: [AnalyticsApplicationModule],
  controllers: [AnalyticsController],
})
export class AnalyticsPresentationModule {}
