import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export function ApiFileUpload(fieldName: string, dtoType: any = null) {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    UseInterceptors(FileInterceptor(fieldName)),
    ApiConsumes('multipart/form-data'),
  ];
  if (dtoType) {
    decorators.push(ApiBody({ type: dtoType }));
  }
  return applyDecorators(...decorators) as any;
}
