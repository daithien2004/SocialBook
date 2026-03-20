import { DomainException } from './domain-exception.base';

export class NotFoundDomainException extends DomainException {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class BadRequestDomainException extends DomainException {
  constructor(message: string = 'Bad request') {
    super(message, 'BAD_REQUEST', 400);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(message: string = 'Conflict') {
    super(message, 'CONFLICT', 409);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class InternalServerDomainException extends DomainException {
  constructor(message: string = 'Internal server error') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
