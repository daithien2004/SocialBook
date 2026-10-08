import { Module } from '@nestjs/common';
import { ContentModerationRepositoryModule } from './repositories/content-moderation-repository.module';

@Module({
  imports: [ContentModerationRepositoryModule],
  exports: [ContentModerationRepositoryModule],
})
export class ContentModerationInfrastructureModule {}
