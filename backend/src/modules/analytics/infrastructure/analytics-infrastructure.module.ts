import { Module } from '@nestjs/common';
import { AnalyticsRepositoryModule } from './repositories/analytics-repository.module';

@Module({
  imports: [AnalyticsRepositoryModule],
  exports: [AnalyticsRepositoryModule],
})
export class AnalyticsInfrastructureModule {}
