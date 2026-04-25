import { Module } from '@nestjs/common';
import { ContentModerationService } from './content-moderation.service';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';

@Module({
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
