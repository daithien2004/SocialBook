import {
  applyDecorators,
  BadRequestException,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export function ApiFileUpload(fieldName: string) {
  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [
    UseInterceptors(
      FileInterceptor(fieldName, {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
          if (!/^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)) {
            callback(
              new BadRequestException({
                code: 'FILE_TYPE_NOT_ALLOWED',
                detail: 'Only JPEG, PNG, WebP, and AVIF images are accepted',
              }),
              false,
            );
            return;
          }
          callback(null, true);
        },
      }),
    ),
  ];

  return applyDecorators(...decorators);
}
