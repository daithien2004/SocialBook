import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../../common/dto/response.dto';

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
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        const transformedData = this.transformIds(data);

        return new ResponseDto({
          success: true,
          statusCode,
          message: transformedData?.message || 'Request successful',
          data:
            transformedData?.data !== undefined
              ? transformedData.data
              : transformedData,
          meta: transformedData?.meta,
          path: request.url,
        });
      }),
    );
  }

  private transformIds(data: any): any {
    if (!data) return data;

    // 🔥 FIX: Kiểm tra nếu là Mongoose Document thì chuyển sang Object thường
    if (typeof data === 'object' && typeof data.toObject === 'function') {
      data = data.toObject();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformIds(item));
    }

    if (typeof data === 'object' && data !== null) {
      if (data instanceof Date || data._bsontype === 'ObjectId') {
        return data;
      }

      const transformed: any = {};

      for (const key in data) {
        // Bỏ qua các key nội bộ của Mongoose bắt đầu bằng $ hoặc _ (trừ _id)
        if (key.startsWith('$') || (key.startsWith('_') && key !== '_id')) {
          continue;
        }

        if (key === '_id') {
          transformed.id = data[key]?.toString() || data[key];
        } else if (key === '__v') {
          continue;
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          transformed[key] = this.transformIds(data[key]);
        } else {
          transformed[key] = data[key];
        }
      }

      return transformed;
    }

    return data;
  }
}
