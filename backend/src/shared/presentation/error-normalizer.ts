import { HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { DomainException } from '@/shared/domain/domain-exception.base';
import { ErrorCode } from '@/shared/domain/error-codes';
import { ERROR_MESSAGES, messageOf } from '@/shared/domain/error-messages';

export interface NormalizedError {
  code: string;
  message: string;
  data?: unknown;
  isSystemError: boolean;
}

export function normalizeError(e: unknown): NormalizedError {
  if (e instanceof DomainException) {
    return {
      code: e.code,
      message: e.message,
      data: e.details,
      isSystemError: false,
    };
  }

  if (e instanceof WsException) {
    const p = e.getError();
    const obj =
      typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : {};
    const code = typeof obj.code === 'string' ? obj.code : ErrorCode.WS_ERROR;
    const message =
      typeof obj.message === 'string'
        ? obj.message
        : typeof p === 'string'
          ? p
          : messageOf(code);
    return {
      code,
      message,
      data: Array.isArray(obj.errors) ? obj.errors : undefined,
      isSystemError: false,
    };
  }

  if (e instanceof HttpException) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: messageOf(ErrorCode.VALIDATION_ERROR, e.message),
      isSystemError: false,
    };
  }

  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR],
    isSystemError: true,
  };
}
