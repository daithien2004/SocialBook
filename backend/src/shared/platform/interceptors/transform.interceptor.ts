import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { PaginationMeta } from '@/shared/domain/pagination.types';
import { ResponseDto } from '@/shared/platform/dto/response.dto';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPaginationMeta(value: unknown): value is PaginationMeta {
  return (
    isRecord(value) &&
    typeof value.current === 'number' &&
    typeof value.pageSize === 'number' &&
    typeof value.total === 'number' &&
    typeof value.totalPages === 'number'
  );
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor<
  unknown,
  ResponseDto<unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ResponseDto<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: unknown) => {
        const value = isRecord(data) ? data : undefined;
        const metaValue = value?.meta ?? value?.metaData;
        const meta = isPaginationMeta(metaValue) ? metaValue : undefined;
        const warning = optionalString(value?.warning);

        if (value?.success === true) {
          return new ResponseDto<unknown>({
            success: true,
            statusCode:
              typeof value.statusCode === 'number'
                ? value.statusCode
                : statusCode,
            message: optionalString(value.message) ?? 'Request successful',
            warning,
            data: value.data,
            meta,
            path: optionalString(value.path) ?? request.url,
          });
        }

        const responseData = value && 'data' in value ? value.data : data;

        return new ResponseDto<unknown>({
          success: true,
          statusCode,
          message:
            optionalString(value?.message) ??
            (warning ? undefined : 'Request successful'),
          warning,
          data: responseData,
          meta,
          path: request.url,
        });
      }),
    );
  }
}
