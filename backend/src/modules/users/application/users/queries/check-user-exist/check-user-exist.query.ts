import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
export class CheckUserExistQuery extends Query<boolean> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
