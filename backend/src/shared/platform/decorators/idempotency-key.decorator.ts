import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export interface IdempotencyKeyOptions {
  required?: boolean;
}

interface RequestHeaders {
  headers: {
    'idempotency-key'?: string | string[];
  };
}

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._~-]{8,128}$/;

export function IdempotencyKey(options: IdempotencyKeyOptions = {}) {
  const required = options.required ?? true;
  const parameterDecorator = createParamDecorator(
    (_data: IdempotencyKeyOptions, context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest<RequestHeaders>();
      const header = request.headers['idempotency-key'];

      if (header === undefined && !required) return undefined;
      if (typeof header !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(header)) {
        throw new BadRequestException(
          'Idempotency-Key must contain 8 to 128 safe characters.',
        );
      }

      return header;
    },
  )(options);

  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ): void => {
    parameterDecorator(target, propertyKey, parameterIndex);

    if (typeof propertyKey !== 'string') return;
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (!descriptor) return;

    ApiHeader({
      name: 'Idempotency-Key',
      required,
      description: 'Reuse this key when retrying the same request.',
      schema: {
        type: 'string',
        minLength: 8,
        maxLength: 128,
        pattern: '^[A-Za-z0-9._~-]{8,128}$',
      },
    })(target, propertyKey, descriptor);
  };
}
