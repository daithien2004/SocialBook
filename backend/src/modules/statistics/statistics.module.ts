import { Module } from '@nestjs/common';
import { StatisticsApplicationModule } from './application/statistics-application.module';
import { StatisticsController } from './presentation/statistics.controller';

@Module({
  imports: [StatisticsApplicationModule],
  controllers: [StatisticsController],
})
export class StatisticsModule {}
