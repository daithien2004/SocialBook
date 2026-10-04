import { ErrorCode } from './error-codes';
import { ERROR_MESSAGES } from './error-messages';

export abstract class DomainException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
