import { Module } from '@nestjs/common';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';

import { GeminiInfrastructureModule } from '../gemini/gemini-infrastructure.module';
import { ContentModerationService } from './content-moderation.service';

@Module({
  imports: [GeminiInfrastructureModule],
  providers: [
    {
      provide: IContentModerationService,
      useClass: ContentModerationService,
    },
  ],
  exports: [IContentModerationService],
})
export class ModerationInfrastructureModule {}
