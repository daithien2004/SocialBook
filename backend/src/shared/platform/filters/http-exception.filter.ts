import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import mongoose from 'mongoose';
import multer from 'multer';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { DomainException } from '@/shared/domain/domain-exception.base';
import {
  ProblemDetailsDto,
  ProblemFieldErrorDto,
} from '../dto/problem-details.dto';

interface ExceptionBody {
  code?: unknown;
  message?: unknown;
  detail?: unknown;
  errors?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isExceptionBody(value: unknown): value is ExceptionBody {
  return isRecord(value);
}

function isFieldErrors(value: unknown): value is ProblemFieldErrorDto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        isRecord(item) &&
        typeof item.field === 'string' &&
        typeof item.code === 'string' &&
        typeof item.message === 'string',
    )
  );
}

function titleForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 429:
      return 'Too Many Requests';
    default:
      return status >= 500 ? 'Internal Server Error' : 'Request Failed';
  }
}

function defaultCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'TOO_MANY_REQUESTS';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
  }
}

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const traceId = typeof request.id === 'string' ? request.id : randomUUID();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let detail = 'Internal server error';
    let errors: ProblemFieldErrorDto[] | undefined;

    if (exception instanceof DomainException) {
      status = this.statusForDomainCode(exception.code);
      code = exception.code;
      detail = status >= 500 ? 'Internal server error' : exception.message;
    } else if (
      exception instanceof MongoServerError &&
      Number(exception.code) === 11000
    ) {
      status = HttpStatus.CONFLICT;
      code = 'DUPLICATE_KEY';
      detail = 'A record with the same unique value already exists';
    } else if (exception instanceof mongoose.Error.CastError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'INVALID_ID';
      detail = `Invalid value for ${exception.path}`;
    } else if (exception instanceof mongoose.Error.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      detail = 'Data validation failed';
      errors = Object.values(exception.errors).map((validationError) => ({
        field: validationError.path,
        code: 'VALIDATION_ERROR',
        message: validationError.message,
      }));
    } else if (
      exception instanceof multer.MulterError &&
      exception.code === 'LIMIT_FILE_SIZE'
    ) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      code = 'FILE_TOO_LARGE';
      detail = 'Uploaded file exceeds the allowed size';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = defaultCodeForStatus(status);
      const body = exception.getResponse();
      if (typeof body === 'string') {
        detail = status >= 500 ? 'Internal server error' : body;
      } else if (isExceptionBody(body)) {
        if (typeof body.code === 'string') code = body.code;
        const candidateDetail =
          typeof body.detail === 'string'
            ? body.detail
            : typeof body.message === 'string'
              ? body.message
              : undefined;
        if (status < 500 && candidateDetail) detail = candidateDetail;
        if (isFieldErrors(body.errors)) errors = body.errors;
        if (
          status === 400 &&
          Array.isArray(body.message) &&
          body.message.every((item: unknown) => typeof item === 'string')
        ) {
          errors = body.message.map((message) => ({
            field: '',
            code: 'VALIDATION_ERROR',
            message,
          }));
          code = 'VALIDATION_ERROR';
          detail = 'Request validation failed';
        }
        if (status === 400 && typeof body.message === 'string') {
          if (body.message.includes('file type')) {
            code = 'FILE_TYPE_NOT_ALLOWED';
            detail = 'Uploaded file type is not allowed';
          } else if (body.message.includes('file size')) {
            status = HttpStatus.PAYLOAD_TOO_LARGE;
            code = 'FILE_TOO_LARGE';
            detail = 'Uploaded file exceeds the allowed size';
          }
        }
      }
    }

    if (status >= 500) {
      this.logger.error(
        `traceId=${traceId} code=${code} ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `traceId=${traceId} code=${code} status=${String(status)}`,
      );
    }

    const problem: ProblemDetailsDto = {
      type: 'about:blank',
      title: titleForStatus(status),
      status,
      code,
      detail,
      traceId,
      ...(errors ? { errors } : {}),
    };

    response
      .status(status)
      .setHeader('x-request-id', traceId)
      .type('application/problem+json')
      .json(problem);
  }

  private statusForDomainCode(code: string): number {
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
