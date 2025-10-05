import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        // Nếu data đã có format chuẩn (có success field), return luôn
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Transform data thành format chuẩn
        return new ResponseDto({
          success: true,
          statusCode,
          message: data?.message || 'Request successful',
          data: data?.data !== undefined ? data.data : data,
          meta: data?.meta,
          path: request.url,
        });
      }),
    );
  }
}
