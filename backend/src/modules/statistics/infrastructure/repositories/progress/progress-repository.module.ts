import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Progress,
  ProgressSchema,
} from '@/modules/library/infrastructure/schemas/public-api';
import { IProgressRepository } from '@/modules/statistics/domain/repositories/progress.repository.interface';
import { ProgressRepository } from './progress.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  providers: [
    {
      provide: IProgressRepository,
      useClass: ProgressRepository,
    },
  ],
  exports: [IProgressRepository],
})
export class ProgressRepositoryModule {}
