import { Identifier } from '@/shared/domain/identifier.base';

export class BookId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(id: string): BookId {
    return new BookId(Identifier.validate(id, 'Book ID'));
  }
}
