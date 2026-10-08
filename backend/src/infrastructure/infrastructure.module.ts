import { Module } from '@nestjs/common';
import { AuthInfrastructureModule } from '@/modules/auth/infrastructure/public-api';
import { CacheInfrastructureModule } from './cache/cache-infrastructure.module';
import { IdGeneratorModule } from './database/id/id-generator.module';
import { OtpRepositoryModule } from '@/modules/auth/infrastructure/repositories/otp/otp-repository.module';
import { AIInfrastructureModule } from '@/modules/ai/infrastructure/public-api';
import { FilesInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';

import { RecommendationsInfrastructureModule } from '@/modules/recommendations/infrastructure/public-api';
import { ChaptersImportModule } from '@/modules/chapters/infrastructure/queues/chapters-import/chapters-import.module';
import { PostModerationQueueModule } from '@/modules/posts/infrastructure/queues/post-moderation/post-moderation.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeInfrastructureModule } from './realtime/realtime-infrastructure.module';

@Module({
  imports: [
    CacheInfrastructureModule,
    AuthInfrastructureModule,
    OtpRepositoryModule,
    AIInfrastructureModule,
    FilesInfrastructureModule,
    MediaInfrastructureModule,

    RecommendationsInfrastructureModule,
    IdGeneratorModule,
    ChaptersImportModule,
    PostModerationQueueModule,
    QueueModule,
    RealtimeInfrastructureModule,
  ],
  exports: [
    CacheInfrastructureModule,
    AuthInfrastructureModule,
    OtpRepositoryModule,
    AIInfrastructureModule,
    FilesInfrastructureModule,
    MediaInfrastructureModule,

    RecommendationsInfrastructureModule,
    IdGeneratorModule,
    ChaptersImportModule,
    PostModerationQueueModule,
    QueueModule,
  ],
})
export class InfrastructureModule {}
