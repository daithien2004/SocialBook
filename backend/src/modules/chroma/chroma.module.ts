import { Module } from '@nestjs/common';
import { ChromaApplicationModule } from './application/chroma-application.module';
import { ChromaController } from './presentation/chroma.controller';
import { AIThrottleModule } from '@/modules/ai/presentation/public-api';
import { ChromaInfrastructureModule } from './infrastructure/chroma-infrastructure.module';
import { ChromaProcessor } from './infrastructure/queue/chroma.processor';
import { ChromaReconciliationCron } from './infrastructure/queue/chroma-reconciliation.cron';
import { BookOutboxRelayCron } from './infrastructure/queue/book-outbox-relay.cron';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';

@Module({
  imports: [
    ChromaApplicationModule,
    ChromaInfrastructureModule,
    BooksRepositoryModule,
    IdGeneratorModule,
    AIThrottleModule,
  ],
  controllers: [ChromaController],
  providers: [
    ...(isWorkerProcess()
      ? [ChromaProcessor, ChromaReconciliationCron, BookOutboxRelayCron]
      : []),
  ],
})
export class ChromaModule {}
