import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import { PrismaStatisticsReadRepository } from './prisma-statistics-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: StatisticsReadRepository,
      useClass: PrismaStatisticsReadRepository,
    },
  ],
  exports: [StatisticsReadRepository],
})
export class StatisticsPersistenceModule {}
