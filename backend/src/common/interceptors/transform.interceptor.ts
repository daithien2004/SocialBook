import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return new ResponseDto({
          success: true,
          statusCode,
          message: data?.message || 'Request successful',
          data:
            data?.data !== undefined
              ? data.data
              : null,
          meta: data?.meta || data?.metaData,
          path: request.url,
        });
      }),
    );
  }
}
