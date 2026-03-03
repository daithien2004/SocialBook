import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ContentModerationService } from './content-moderation.service';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';

@Module({
  providers: [
    CloudinaryService,
    ContentModerationService,
    { provide: IMediaService, useClass: CloudinaryService },
    { provide: IContentModerationService, useClass: ContentModerationService },
  ],
  exports: [IMediaService, IContentModerationService, CloudinaryService, ContentModerationService],
})
export class ExternalServicesModule {}
