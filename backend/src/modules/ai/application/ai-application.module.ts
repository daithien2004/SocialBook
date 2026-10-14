import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GenerateTextHandler } from './commands/generate-text/generate-text.handler';
import { SummarizeChapterHandler } from './commands/summarize-chapter/summarize-chapter.handler';
import { AIRequestRepositoryModule } from '@/modules/ai/infrastructure/repositories/ai-requests/ai-request-repository.module';
import { AIInfrastructureModule } from '@/modules/ai/infrastructure/public-api';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { RateLimitConfigModule } from '../infrastructure/rate-limit/ai-rate-limit.module';
import { GetRateLimitConfigHandler } from './queries/get-rate-limit-config/get-rate-limit-config.handler';
import { UpdateRateLimitConfigHandler } from './commands/update-rate-limit-config/update-rate-limit-config.handler';

@Module({
  imports: [
    CqrsModule,
    AIRequestRepositoryModule,
    AIInfrastructureModule,
    IdGeneratorModule,
    ChaptersRepositoryModule,
    RateLimitConfigModule,
  ],
  providers: [
    GenerateTextHandler,
    SummarizeChapterHandler,
    GetRateLimitConfigHandler,
    UpdateRateLimitConfigHandler,
  ],
  exports: [
    AIRequestRepositoryModule,
    AIInfrastructureModule,
    GenerateTextHandler,
    SummarizeChapterHandler,
  ],
})
export class AIApplicationModule {}
