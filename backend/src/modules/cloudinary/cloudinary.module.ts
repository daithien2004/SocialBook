import { Module } from '@nestjs/common';
import { CloudinaryService } from './infrastructure/services/cloudinary.service';
import { CloudinaryProvider } from '@/src/shared/cloudinary/cloudinary.config';
import { IMediaService } from './domain/interfaces/media.service.interface';

@Module({
  providers: [
    CloudinaryProvider, 
    CloudinaryService,
    { provide: IMediaService, useClass: CloudinaryService }
  ],
  exports: [CloudinaryService, IMediaService],
})
export class CloudinaryModule {}
