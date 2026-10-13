import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IAIRequestRepository } from '@/modules/ai/domain';
import { AIRequestRepository } from './ai-request.repository';
import { AIRequestRetentionWorker } from './ai-request-retention.worker';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IAIRequestRepository,
      useClass: AIRequestRepository,
    },
    ...(isWorkerProcess() ? [AIRequestRetentionWorker] : []),
  ],
  exports: [IAIRequestRepository],
})
export class AIRequestRepositoryModule {}
