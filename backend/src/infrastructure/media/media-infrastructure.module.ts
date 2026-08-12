import { Module } from '@nestjs/common';
import { IMediaPort } from '@/domain/cloudinary/interfaces/media.port';
import { CloudinaryAdapter } from './cloudinary.adapter';

@Module({
  providers: [
    {
      provide: IMediaPort,
      useClass: CloudinaryAdapter,
    },
  ],
  exports: [IMediaPort],
})
export class MediaInfrastructureModule {}
