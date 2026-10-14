import { DomainError } from '@/shared/domain/errors';

export class __Name__NotFoundError extends DomainError {
  readonly kind = 'not_found';
  constructor(id: string) {
    super(`__Name__ ${id} not found`, '__UPPER___NOT_FOUND');
  }
}

export class Empty__Name__TitleError extends DomainError {
  readonly kind = 'validation';
  constructor() {
    super('__Name__ title must not be empty', '__UPPER___TITLE_EMPTY');
  }
}
