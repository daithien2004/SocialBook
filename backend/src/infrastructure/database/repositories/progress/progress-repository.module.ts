import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Progress, ProgressSchema } from '@/infrastructure/database/schemas/progress.schema';
import { IProgressRepository } from '@/domain/progress/repositories/progress.repository.interface';
import { ProgressRepository } from './progress.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Progress.name, schema: ProgressSchema }]),
  ],
  providers: [
    {
      provide: IProgressRepository,
      useClass: ProgressRepository,
    },
  ],
  exports: [
    MongooseModule,
    IProgressRepository,
  ],
})
export class ProgressRepositoryModule {}
