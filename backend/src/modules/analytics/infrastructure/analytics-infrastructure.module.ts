import { Module } from '@nestjs/common';
import { AnalyticsRepositoryModule } from './repositories/analytics-repository.module';
import { RedisAnalyticsEventBufferAdapter } from './redis/redis-analytics-event-buffer.adapter';
import { AnalyticsEventBufferPort } from '../application/ports/analytics-event-buffer.port';

@Module({
  imports: [AnalyticsRepositoryModule],
  providers: [
    {
      provide: AnalyticsEventBufferPort,
      useClass: RedisAnalyticsEventBufferAdapter,
    },
  ],
  exports: [AnalyticsRepositoryModule, AnalyticsEventBufferPort],
})
export class AnalyticsInfrastructureModule {}
