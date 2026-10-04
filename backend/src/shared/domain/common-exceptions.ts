export { DomainException } from './domain-exception.base';
import { DomainException } from './domain-exception.base';
import { ErrorCode } from './error-codes';

export class NotFoundDomainException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message);
  }
}

export class BadRequestDomainException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.BAD_REQUEST, message);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.CONFLICT, message);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.FORBIDDEN, message);
  }
}

export class InternalServerDomainException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.INTERNAL_ERROR, message);
  }
}

export class ConcurrencyException extends DomainException {
  constructor(details?: unknown) {
    super(ErrorCode.CONCURRENCY_CONFLICT, undefined, details);
  }
}

export class RoomFullDomainException extends DomainException {
  constructor(details?: unknown) {
    super(ErrorCode.ROOM_FULL, undefined, details);
  }
}

export interface ValidationIssue {
  field: string;
  constraints: string[];
}

export class ValidationException extends DomainException {
  constructor(issues: ValidationIssue[]) {
    super(ErrorCode.VALIDATION_ERROR, undefined, issues);
  }
}

export class AuthException extends DomainException {
  constructor(code: ErrorCode, details?: unknown) {
    super(code, undefined, details);
  }
}
