import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class GetTopActiveReadersQuery extends Query<
  { userId: string; username: string; avatar: string | null; score: number }[]
> {
  constructor(
    public readonly actor: Actor,
    public readonly days?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
