import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IUserAnalyticsRepository } from '@/modules/analytics/domain/repositories/user-analytics.repository.interface';
import { PostgresUserAnalyticsRepository } from './postgres-user-analytics.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IUserAnalyticsRepository,
      useClass: PostgresUserAnalyticsRepository,
    },
  ],
  exports: [IUserAnalyticsRepository],
})
export class AnalyticsRepositoryModule {}
