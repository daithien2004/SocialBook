import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get('env.CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('env.CLOUDINARY_API_KEY'),
      api_secret: configService.get('env.CLOUDINARY_API_SECRET'),
    });
  },
};
