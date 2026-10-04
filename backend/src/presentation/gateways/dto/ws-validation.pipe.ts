import {
  ArgumentMetadata,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import {
  VALIDATION_FAILED_CODE,
  VALIDATION_FAILED_MESSAGE,
} from '../reading-room.constants';

export interface WsValidationIssue {
  field: string;
  constraints?: Record<string, string>;
}

/** Payload lỗi gửi về client trên kênh `error` (shape mới, chỉ thêm không thay). */
export const wsValidationException = (
  errors: WsValidationIssue[],
): WsException =>
  new WsException({
    code: VALIDATION_FAILED_CODE,
    message: VALIDATION_FAILED_MESSAGE,
    errors,
  });

export const wsValidationExceptionFactory = (
  errors: ValidationError[],
): WsException =>
  wsValidationException(
    errors.map((e) => ({ field: e.property, constraints: e.constraints })),
  );

/**
 * ValidationPipe cho các `@SubscribeMessage` (global pipe của HTTP không áp
 * cho gateway).
 *
 * Lớp chặn thêm: payload body không phải object hợp lệ (`undefined`,
 * `null`, mảng, số, chuỗi) phải trả VALIDATION_FAILED ngay — không rơi
 * vào class-validator (vỡ trên null) và không chạy tiếp vào handler.
 */
export class WsValidationPipe extends ValidationPipe {
  override transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    // Chỉ validate @MessageBody. Tham số `@ConnectedSocket`/`@WsUser` phải
    // đi qua nguyên vẹn — nếu để ValidationPipe xử lý chúng thì socket sẽ bị
    // plainToInstance và hỏng.
    if (metadata.type !== 'body') {
      return Promise.resolve(value);
    }

    const isPlainObject =
      typeof value === 'object' && value !== null && !Array.isArray(value);
    if (!isPlainObject) {
      throw wsValidationException([
        {
          field: 'body',
          constraints: { invalidType: 'payload phải là object' },
        },
      ]);
    }
    return super.transform(value, metadata);
  }
}
