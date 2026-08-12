import { Module } from '@nestjs/common';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [
    {
      provide: IMediaService,
      useClass: CloudinaryService,
    },
  ],
  exports: [IMediaService],
})
export class MediaInfrastructureModule {}
