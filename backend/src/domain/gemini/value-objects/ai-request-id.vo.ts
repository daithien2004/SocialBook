import { Identifier } from '@/shared/domain/identifier.base';

export class AIRequestId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(id: string): AIRequestId {
    return new AIRequestId(Identifier.validate(id, 'AI Request ID'));
  }
}
