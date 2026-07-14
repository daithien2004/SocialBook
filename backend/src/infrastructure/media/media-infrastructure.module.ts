import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';

@Module({
  providers: [
    CloudinaryService,
    {
      provide: IMediaService,
      useClass: CloudinaryService,
    },
  ],
  exports: [CloudinaryService, IMediaService],
})
export class MediaInfrastructureModule {}
