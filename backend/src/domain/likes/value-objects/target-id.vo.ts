import { Identifier } from '@/shared/domain/identifier.base';

export class TargetId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(id: string): TargetId {
    return new TargetId(Identifier.validate(id, 'Target ID'));
  }
}
