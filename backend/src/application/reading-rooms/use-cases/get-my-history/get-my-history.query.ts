import { Query } from '@nestjs/cqrs';
export class GetMyHistoryQuery extends Query<{ items: any[]; total: number }> {
  constructor(
    public readonly userId: string,
    public readonly skip?: number,
    public readonly limit?: number,
  ) {
    super();}
}
