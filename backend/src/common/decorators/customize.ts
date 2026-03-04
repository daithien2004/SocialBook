import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export function ApiFileUpload(fieldName: string, dtoType: any = null) {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    UseInterceptors(FileInterceptor(fieldName)),
  ];

  return applyDecorators(...decorators) as any;
}

