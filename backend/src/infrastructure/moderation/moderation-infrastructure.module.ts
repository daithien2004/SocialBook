import { Module } from '@nestjs/common';
import { ContentModerationService } from './content-moderation.service';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';

import { AIInfrastructureModule } from '../ai/ai-infrastructure.module';

@Module({
  imports: [AIInfrastructureModule],
  providers: [
    ContentModerationService,
    {
      provide: IContentModerationService,
      useClass: ContentModerationService,
    },
  ],
  exports: [ContentModerationService, IContentModerationService],
})
export class ModerationInfrastructureModule {}
