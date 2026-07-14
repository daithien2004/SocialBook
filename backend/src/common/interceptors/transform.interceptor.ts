import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '@/common/dto/response.dto';
import { PaginationMeta } from '@/common/interfaces/pagination.interface';
import { Request, Response } from 'express';

interface ResponseLike {
  success?: boolean;
  message?: string;
  warning?: string;
  data?: unknown;
  meta?: unknown;
  metaData?: unknown;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseDto<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: T) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in (data as Record<string, unknown>)
        ) {
          return data as unknown as ResponseDto<T>;
        }

        const responseData = data as unknown as ResponseLike;

        return new ResponseDto({
          success: true,
          statusCode,
          message:
            responseData?.message ||
            (responseData?.warning ? undefined : 'Request successful'),
          warning: responseData?.warning,
          data:
            responseData?.data !== undefined
              ? (responseData.data as T)
              : undefined,
          meta: (responseData?.meta || responseData?.metaData) as
            | PaginationMeta
            | undefined,
          path: request.url,
        });
      }),
    );
  }
}
