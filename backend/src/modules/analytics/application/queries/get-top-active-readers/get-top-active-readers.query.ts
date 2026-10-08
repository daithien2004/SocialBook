import { Query } from '@nestjs/cqrs';

export class GetTopActiveReadersQuery extends Query<
  { userId: string; username: string; avatar: string | null; score: number }[]
> {
  constructor(
    public readonly days?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
