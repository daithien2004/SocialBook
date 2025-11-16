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
        // Nếu data đã có format chuẩn (có success field), return luôn
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // ✅ Transform _id → id TRƯỚC KHI wrap vào ResponseDto
        const transformedData = this.transformIds(data);

        // Transform data thành format chuẩn
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

  // ✅ Hàm transform _id → id
  private transformIds(data: any): any {
    if (!data) return data;

    // Nếu là array
    if (Array.isArray(data)) {
      return data.map((item) => this.transformIds(item));
    }

    // Nếu là object
    if (typeof data === 'object' && data !== null) {
      // Nếu là Date, ObjectId primitive, giữ nguyên
      if (data instanceof Date || data._bsontype === 'ObjectId') {
        return data;
      }

      const transformed: any = {};

      for (const key in data) {
        if (key === '_id') {
          // ✅ Đổi _id thành id
          transformed.id = data[key]?.toString() || data[key];
        } else if (key === '__v') {
          // ❌ Bỏ qua __v
          continue;
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          // 🔄 Đệ quy cho nested objects/arrays
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
