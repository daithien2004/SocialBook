import { Identifier } from '@/shared/domain/identifier.base';

export class GenreId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(id: string): GenreId {
    return new GenreId(Identifier.validate(id, 'Genre ID'));
  }
}
