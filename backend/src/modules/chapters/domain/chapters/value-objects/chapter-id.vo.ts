import { Identifier } from '@/shared/domain/identifier.base';

export class ChapterId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(id: string): ChapterId {
    return new ChapterId(Identifier.validate(id, 'Chapter ID'));
  }
}
