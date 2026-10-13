import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IProgressRepository } from '@/modules/statistics/domain/repositories/progress.repository.interface';
import { ProgressRepository } from './progress.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IProgressRepository,
      useClass: ProgressRepository,
    },
  ],
  exports: [IProgressRepository],
})
export class ProgressRepositoryModule {}
