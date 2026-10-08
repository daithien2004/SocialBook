import { Identifier } from '@/shared/domain/identifier.base';

export class FollowId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(id: string): FollowId {
    return new FollowId(Identifier.validate(id, 'Follow ID'));
  }
}
