import { ConcurrencyException } from '@/shared/domain/common-exceptions';
import { DomainException } from '@/shared/domain/domain-exception.base';
import { ErrorCode } from '@/shared/domain/error-codes';

export class ReadingRoomNotFoundError extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.READING_ROOM_NOT_FOUND, message);
  }
}

export class ReadingRoomInvalidError extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.READING_ROOM_INVALID, message);
  }
}

export class ReadingRoomForbiddenError extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.READING_ROOM_FORBIDDEN, message);
  }
}

export class ReadingRoomConflictError extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.READING_ROOM_CONFLICT, message);
  }
}

export class ReadingRoomConcurrencyError extends ConcurrencyException {
  constructor(details?: unknown) {
    super(details, ErrorCode.READING_ROOM_CONCURRENCY_CONFLICT);
  }
}

export class ReadingRoomFullError extends DomainException {
  constructor(details?: unknown) {
    super(ErrorCode.READING_ROOM_FULL, undefined, details);
  }
}
