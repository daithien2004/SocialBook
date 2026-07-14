import {
  Catch,
  ArgumentsHost,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { MongoServerError } from 'mongodb';

@Catch(MongoServerError)
export class MongoExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  override catch(exception: MongoServerError, host: ArgumentsHost) {
    if (exception.code === 11000) {
      const field = Object.keys(
        exception.keyPattern as Record<string, unknown>,
      ).join(', ');
      throw new ConflictException(`Giá trị đã tồn tại: ${field}`);
    }

    this.logger.warn(`Unhandled MongoDB error: ${exception.message}`);
    super.catch(exception, host);
  }
}
