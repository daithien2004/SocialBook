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
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineChromaAbilities } from './application/policies/chroma.ability';

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
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineChromaAbilities]),
    },
    PoliciesGuard,
    ...(isWorkerProcess()
      ? [ChromaProcessor, ChromaReconciliationCron, BookOutboxRelayCron]
      : []),
  ],
})
export class ChromaModule {}
