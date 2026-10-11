import { Module } from '@nestjs/common';
import { ChromaRepositoryModule } from './repositories/chroma-repository.module';
import { BullModule } from '@nestjs/bullmq';
import { DEFAULT_JOB_OPTIONS } from '@/shared/queue/default-job-options';

@Module({
  imports: [
    ChromaRepositoryModule,
    BullModule.registerQueue({
      name: 'chroma',
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),
  ],
  exports: [ChromaRepositoryModule, BullModule],
})
export class ChromaInfrastructureModule {}
