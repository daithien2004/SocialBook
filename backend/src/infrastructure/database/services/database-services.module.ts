import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ContentModerationService } from './content-moderation.service';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';

import { LocationCheckService } from './location-check.service';
import { UsersRepositoryModule } from '../repositories/users/users-repository.module';
import { ChaptersRepositoryModule } from '../repositories/chapters/chapters-repository.module';
import { ProgressRepositoryModule } from '../repositories/progress/progress-repository.module';

@Module({
  imports: [
    UsersRepositoryModule,
    ChaptersRepositoryModule,
    ProgressRepositoryModule,
  ],
  providers: [
    CloudinaryService,
    LocationCheckService,
    {
      provide: IContentModerationService,
      useClass: ContentModerationService,
    },
    {
      provide: IMediaService,
      useClass: CloudinaryService,
    },
  ],
  exports: [
    CloudinaryService,
    IContentModerationService,
    IMediaService,
    LocationCheckService,
  ],
})
export class DatabaseServicesModule {}
