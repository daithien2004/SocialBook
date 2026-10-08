import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoServerError } from 'mongodb';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../dto/response.dto';
import { DomainException } from '@/shared/domain/domain-exception.base';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function messageFrom(value: unknown): string | string[] | undefined {
  if (typeof value === 'string') return value;
  if (
    Array.isArray(value) &&
    value.every((item: unknown): item is string => typeof item === 'string')
  ) {
    return value;
  }
  return undefined;
}

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof MongoServerError) {
      if (exception.code === 11000) {
        const keyPattern: unknown = exception.keyPattern;
        const field = isRecord(keyPattern)
          ? Object.keys(keyPattern).join(', ')
          : '';
        status = HttpStatus.CONFLICT;
        message = `Giá trị đã tồn tại: ${field}`;
        error = 'Conflict';
      } else {
        this.logger.error(
          `Unhandled MongoDB error: ${exception.message}`,
          exception.stack,
        );
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (isRecord(exceptionResponse)) {
        message = messageFrom(exceptionResponse.message) ?? message;
        error =
          typeof exceptionResponse.error === 'string'
            ? exceptionResponse.error
            : exception.name;
      }
    } else if (exception instanceof DomainException) {
      status = this.mapErrorCodeToHttpStatus(exception.code);
      message = exception.message;
      error = exception.code;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unknown exception type', exception);
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(this.configService.get('env.NODE_ENV') === 'development' &&
        exception instanceof Error && { stack: exception.stack }),
    };

    response.status(status).json(errorResponse);
  }

  private mapErrorCodeToHttpStatus(code: string): number {
    switch (code) {
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'UNAUTHORIZED':
      case 'TOKEN_EXPIRED':
      case 'TOKEN_REVOKED':
        return HttpStatus.UNAUTHORIZED;
      case 'FORBIDDEN':
        return HttpStatus.FORBIDDEN;
      case 'CONFLICT':
      case 'CONCURRENCY_CONFLICT':
      case 'ROOM_FULL':
        return HttpStatus.CONFLICT;
      case 'RATE_LIMITED':
      case 'TOO_MANY_CONNECTIONS':
        return HttpStatus.TOO_MANY_REQUESTS;
      case 'INTERNAL_ERROR':
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
