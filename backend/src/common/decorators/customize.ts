import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export function ApiFileUpload(fieldName: string, dtoType: any = null) {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    UseInterceptors(FileInterceptor(fieldName, {
      limits: { fileSize: 5 * 1024 * 1024 },
    })),
  ];

  return applyDecorators(...decorators) as any;
}

