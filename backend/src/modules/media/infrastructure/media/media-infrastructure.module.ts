import { Module } from '@nestjs/common';
import { IMediaPort } from '@/modules/media/domain/media.port';
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
