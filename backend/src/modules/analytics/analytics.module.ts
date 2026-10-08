import { Module } from '@nestjs/common';
import { AnalyticsApplicationModule } from './application/analytics-application.module';
import { AnalyticsController } from './presentation/analytics.controller';

@Module({
  imports: [AnalyticsApplicationModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
