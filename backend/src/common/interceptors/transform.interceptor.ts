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
        // QUAN TRỌNG: Thêm WeakSet để track visited objects
        const visited = new WeakSet();
        const transformedData = this.transformIds(data, visited);

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

  // ✅ Hàm transform _id → id với circular reference protection
  private transformIds(data: any, visited: WeakSet<object>): any {
    if (!data) return data;

    // Primitive types (string, number, boolean, etc.)
    if (typeof data !== 'object') {
      return data;
    }

    // ⚠️ CRITICAL: Check circular reference
    if (visited.has(data)) {
      return undefined; // Hoặc return '[Circular]' để debug
    }

    // Nếu là Date hoặc ObjectId primitive, giữ nguyên
    if (data instanceof Date || data._bsontype === 'ObjectId') {
      return data;
    }

    // Add to visited set TRƯỚC KHI đệ quy
    visited.add(data);

    // Nếu là array
    if (Array.isArray(data)) {
      return data.map((item) => this.transformIds(item, visited));
    }

    // Nếu là object
    const transformed: any = {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (key === '_id') {
          // ✅ Đổi _id thành id
          transformed.id = data[key]?.toString() || data[key];
        } else if (key === '__v') {
          // ❌ Bỏ qua __v
          continue;
        } else {
          // 🔄 Đệ quy cho nested objects/arrays
          transformed[key] = this.transformIds(data[key], visited);
        }
      }
    }

    return transformed;
  }
}
